import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

// ── Shared simulation types ────────────────────────────────────────────────
type NavExtras = { queryParams?: Record<string, string>; fragment?: string; skipLocationChange?: boolean; replaceUrl?: boolean };
const simUrl = signal('/home');
function simNavigate(path: string, extras?: NavExtras) {
  let url = path;
  if (extras?.queryParams) {
    const qs = Object.entries(extras.queryParams).map(([k, v]) => `${k}=${v}`).join('&');
    url += '?' + qs;
  }
  if (extras?.fragment) url += '#' + extras.fragment;
  simUrl.set(url);
}

// ── Ex01 – RouterLink concept ──────────────────────────────────────────────
@Component({
  selector: 'ex-01', standalone: true, template: `
    <p>RouterLink turns an anchor into a client-side nav link.</p>
    <pre>&lt;a routerLink="/home"&gt;Home&lt;/a&gt;
&lt;a routerLink="/about"&gt;About&lt;/a&gt;</pre>
    <p>Current simulated URL: <code>{{ url() }}</code></p>
    <button (click)="go('/home')">/ home</button>
    <button (click)="go('/about')">/ about</button>
  `
})
export class Ex01 {
  url = simUrl;
  go(p: string) { simNavigate(p); }
}

// ── Ex02 – RouterLinkActive concept ───────────────────────────────────────
@Component({
  selector: 'ex-02', standalone: true, template: `
    <p>RouterLinkActive adds a CSS class when the route is active.</p>
    <pre>&lt;a routerLink="/home" routerLinkActive="active"&gt;Home&lt;/a&gt;</pre>
    <p>Active link highlighted: <strong [style.color]="url().startsWith('/home') ? 'green' : 'black'">Home</strong></p>
  `
})
export class Ex02 { url = simUrl; }

// ── Ex03 – RouterOutlet concept ───────────────────────────────────────────
@Component({
  selector: 'ex-03', standalone: true, template: `
    <p>RouterOutlet is a placeholder where routed components are inserted.</p>
    <pre>&lt;router-outlet /&gt;</pre>
    <div style="border:1px dashed #999;padding:8px">
      <em>[ routed component renders here → simulated: {{ url() }} ]</em>
    </div>
  `
})
export class Ex03 { url = simUrl; }

// ── Ex04 – router.navigate() ──────────────────────────────────────────────
@Component({
  selector: 'ex-04', standalone: true, template: `
    <p>router.navigate() programmatic navigation via array of segments.</p>
    <pre>this.router.navigate(['/products', id]);</pre>
    <button (click)="nav()">Navigate to /products/42</button>
    <p>URL: {{ url() }}</p>
  `
})
export class Ex04 {
  url = simUrl;
  nav() { simNavigate('/products/42'); }
}

// ── Ex05 – router.navigateByUrl() ─────────────────────────────────────────
@Component({
  selector: 'ex-05', standalone: true, template: `
    <p>navigateByUrl() accepts a full URL string.</p>
    <pre>this.router.navigateByUrl('/products?page=2');</pre>
    <button (click)="nav()">navigateByUrl</button>
    <p>URL: {{ url() }}</p>
  `
})
export class Ex05 {
  url = simUrl;
  nav() { simNavigate('/products?page=2'); }
}

// ── Ex06 – Router events (NavigationStart) ────────────────────────────────
@Component({
  selector: 'ex-06', standalone: true, template: `
    <p>Router emits events like NavigationStart, NavigationEnd, etc.</p>
    <pre>this.router.events.pipe(filter(e => e instanceof NavigationEnd))
  .subscribe(e => console.log(e.url));</pre>
    <p>Simulated event log:</p>
    <ul>@for (e of events(); track e) { <li>{{ e }}</li> }</ul>
    <button (click)="simulate()">Simulate Navigation</button>
  `
})
export class Ex06 {
  events = signal<string[]>([]);
  simulate() {
    this.events.update(e => [...e, `NavigationStart: /page-${Date.now() % 100}`]);
    setTimeout(() => this.events.update(ev => [...ev, `NavigationEnd: /page-${Date.now() % 100}`]), 200);
  }
}

// ── Ex07 – URL construction with RouterLink array ─────────────────────────
@Component({
  selector: 'ex-07', standalone: true, template: `
    <p>RouterLink accepts an array for dynamic segments.</p>
    <pre>[routerLink]="['/users', userId, 'posts', postId]"</pre>
    <p>Resulting URL: <code>/users/{{ userId() }}/posts/{{ postId() }}</code></p>
    <button (click)="change()">Change IDs</button>
  `
})
export class Ex07 {
  userId = signal(5);
  postId = signal(12);
  change() { this.userId.update(n => n + 1); this.postId.update(n => n + 1); }
}

// ── Ex08 – RouterLink with queryParams ────────────────────────────────────
@Component({
  selector: 'ex-08', standalone: true, template: `
    <p>Pass queryParams via RouterLink binding.</p>
    <pre>[routerLink]="['/search']" [queryParams]="{ q: term, page: 1 }"</pre>
    <input [value]="term()" (input)="term.set($any($event.target).value)" placeholder="search term">
    <p>Generated URL: <code>/search?q={{ term() }}&page=1</code></p>
  `
})
export class Ex08 { term = signal('angular'); }

// ── Ex09 – RouterLink with fragment ───────────────────────────────────────
@Component({
  selector: 'ex-09', standalone: true, template: `
    <p>Fragment links scroll to an anchor on the page.</p>
    <pre>[routerLink]="['/docs']" fragment="api-reference"
→ /docs#api-reference</pre>
    <button (click)="nav()">Navigate with fragment</button>
    <p>URL: {{ url() }}</p>
  `
})
export class Ex09 {
  url = simUrl;
  nav() { simNavigate('/docs', { fragment: 'api-reference' }); }
}

// ── Ex10 – skipLocationChange ─────────────────────────────────────────────
@Component({
  selector: 'ex-10', standalone: true, template: `
    <p>skipLocationChange navigates without updating the browser URL bar.</p>
    <pre>router.navigate(['/internal'], { skipLocationChange: true });</pre>
    <button (click)="nav()">Navigate (URL won't change in real app)</button>
    <p>Sim URL: {{ url() }}</p>
  `
})
export class Ex10 {
  url = simUrl;
  nav() { simNavigate('/internal-only', { skipLocationChange: true }); }
}

// ── Ex11 – replaceUrl ─────────────────────────────────────────────────────
@Component({
  selector: 'ex-11', standalone: true, template: `
    <p>replaceUrl replaces the current history entry instead of pushing a new one.</p>
    <pre>router.navigate(['/redirect-target'], { replaceUrl: true });</pre>
    <button (click)="nav()">Replace URL</button>
    <p>URL: {{ url() }}</p>
  `
})
export class Ex11 {
  url = simUrl;
  nav() { simNavigate('/redirect-target', { replaceUrl: true }); }
}

// ── Ex12 – router.url ─────────────────────────────────────────────────────
@Component({
  selector: 'ex-12', standalone: true, template: `
    <p>router.url returns the current URL string synchronously.</p>
    <pre>const current = this.router.url; // e.g. '/products?page=2'</pre>
    <p>Simulated router.url: <code>{{ url() }}</code></p>
  `
})
export class Ex12 { url = simUrl; }

// ── Ex13 – navigate() extras: queryParamsHandling ─────────────────────────
@Component({
  selector: 'ex-13', standalone: true, template: `
    <p>queryParamsHandling: 'merge' merges new params with existing ones.</p>
    <pre>router.navigate([], { queryParams: { sort: 'asc' },
  queryParamsHandling: 'merge' });</pre>
    <p>Current params: <code>{{ params() }}</code></p>
    <button (click)="merge()">Merge sort=asc</button>
  `
})
export class Ex13 {
  params = signal('page=1');
  merge() { this.params.set('page=1&sort=asc'); }
}

// ── Ex14 – withHashLocation ───────────────────────────────────────────────
@Component({
  selector: 'ex-14', standalone: true, template: `
    <p>withHashLocation uses hash-based URLs (/#/path).</p>
    <pre>provideRouter(routes, withHashLocation())</pre>
    <p>URLs look like: <code>http://example.com/#/home</code></p>
    <p>Good for static hosting without server config.</p>
  `
})
export class Ex14 {}

// ── Ex15 – withBrowserHistoryLocation (default) ───────────────────────────
@Component({
  selector: 'ex-15', standalone: true, template: `
    <p>withBrowserHistoryLocation (default) uses HTML5 pushState.</p>
    <pre>provideRouter(routes)
// same as provideRouter(routes, withBrowserHistoryLocation())</pre>
    <p>URLs look like: <code>http://example.com/home</code></p>
    <p>Requires server rewrite rule for all paths → index.html.</p>
  `
})
export class Ex15 {}

// ── Ex16 – Route config structure ─────────────────────────────────────────
@Component({
  selector: 'ex-16', standalone: true, template: `
    <p>A Route object has many optional properties.</p>
    <pre>const route: Route = {{ '{' }}
  path: 'products/:id',
  component: ProductDetailComponent,
  title: 'Product Detail',
  data: {{ '{' }} breadcrumb: 'Products' {{ '}' }},
  resolve: {{ '{' }} product: productResolver {{ '}' }},
  canActivate: [authGuard],
  canDeactivate: [unsavedGuard],
{{ '}' }};</pre>
  `
})
export class Ex16 {}

// ── Ex17 – pathMatch: 'full' ──────────────────────────────────────────────
@Component({
  selector: 'ex-17', standalone: true, template: `
    <p>pathMatch: 'full' matches only if the entire URL equals the path.</p>
    <pre>{ path: '', pathMatch: 'full', redirectTo: 'home' }</pre>
    <p>Without 'full', the empty string would match every route.</p>
  `
})
export class Ex17 {}

// ── Ex18 – redirectTo ─────────────────────────────────────────────────────
@Component({
  selector: 'ex-18', standalone: true, template: `
    <p>redirectTo redirects a path to another path.</p>
    <pre>{ path: '', pathMatch: 'full', redirectTo: 'dashboard' },
{ path: 'old-path', redirectTo: '/new-path', pathMatch: 'full' }</pre>
  `
})
export class Ex18 {}

// ── Ex19 – Wildcard ** route ──────────────────────────────────────────────
@Component({
  selector: 'ex-19', standalone: true, template: `
    <p>The ** wildcard catches all unmatched routes (404 page).</p>
    <pre>{ path: '**', component: NotFoundComponent }
// Must be the LAST route in the array!</pre>
  `
})
export class Ex19 {}

// ── Ex20 – children array ─────────────────────────────────────────────────
@Component({
  selector: 'ex-20', standalone: true, template: `
    <p>Nested routes are defined with a 'children' array.</p>
    <pre>{{ '{' }}
  path: 'admin',
  component: AdminLayoutComponent,
  children: [
    {{ '{' }} path: 'users', component: UsersComponent {{ '}' }},
    {{ '{' }} path: 'settings', component: SettingsComponent {{ '}' }},
  ]
{{ '}' }}</pre>
  `
})
export class Ex20 {}

// ── Ex21 – loadComponent (lazy standalone) ────────────────────────────────
@Component({
  selector: 'ex-21', standalone: true, template: `
    <p>loadComponent lazily loads a standalone component.</p>
    <pre>{{ '{' }}
  path: 'profile',
  loadComponent: () =>
    import('./profile.component').then(m => m.ProfileComponent)
{{ '}' }}</pre>
  `
})
export class Ex21 {}

// ── Ex22 – loadChildren (lazy routes) ─────────────────────────────────────
@Component({
  selector: 'ex-22', standalone: true, template: `
    <p>loadChildren lazily loads a routes array from another file.</p>
    <pre>{{ '{' }}
  path: 'shop',
  loadChildren: () =>
    import('./shop/shop.routes').then(m => m.SHOP_ROUTES)
{{ '}' }}</pre>
  `
})
export class Ex22 {}

// ── Ex23 – Route title ────────────────────────────────────────────────────
@Component({
  selector: 'ex-23', standalone: true, template: `
    <p>The title property sets the browser tab title for the route.</p>
    <pre>{ path: 'dashboard', component: DashboardComponent, title: 'Dashboard' }
// Or a TitleStrategy service for dynamic titles</pre>
  `
})
export class Ex23 {}

// ── Ex24 – Route data (static) ────────────────────────────────────────────
@Component({
  selector: 'ex-24', standalone: true, template: `
    <p>Route data provides static metadata accessible via ActivatedRoute.</p>
    <pre>{{ '{' }} path: 'admin', component: AdminComponent,
  data: {{ '{' }} role: 'admin', breadcrumb: 'Admin Panel' {{ '}' }} {{ '}' }}

// Access:
const data = inject(ActivatedRoute).snapshot.data;</pre>
  `
})
export class Ex24 {}

// ── Ex25 – Route resolve ──────────────────────────────────────────────────
@Component({
  selector: 'ex-25', standalone: true, template: `
    <p>resolve pre-fetches data before the component activates.</p>
    <pre>{{ '{' }}
  path: 'products/:id',
  component: ProductComponent,
  resolve: {{ '{' }} product: productResolver {{ '}' }}
{{ '}' }}
// productResolver: ResolveFn&lt;Product&gt; = (route) =>
//   inject(ProductService).getById(route.params['id']);</pre>
  `
})
export class Ex25 {}

// ── Ex26 – Route canActivate ──────────────────────────────────────────────
@Component({
  selector: 'ex-26', standalone: true, template: `
    <p>canActivate guards control access to routes.</p>
    <pre>{{ '{' }}
  path: 'dashboard',
  component: DashboardComponent,
  canActivate: [authGuard]
{{ '}' }}

export const authGuard: CanActivateFn = () =>
  inject(AuthService).isLoggedIn() || inject(Router).createUrlTree(['/login']);</pre>
  `
})
export class Ex26 {}

// ── Ex27 – Route canDeactivate ────────────────────────────────────────────
@Component({
  selector: 'ex-27', standalone: true, template: `
    <p>canDeactivate prevents navigation away from dirty forms.</p>
    <pre>canDeactivate: [(component: EditComponent) =>
  component.isDirty() ? confirm('Leave?') : true]</pre>
    <p>Simulated: form dirty = {{ dirty() }}</p>
    <button (click)="dirty.set(!dirty())">Toggle Dirty</button>
    <button (click)="tryLeave()">Try Leave</button>
    <p style="color:{{ result() === 'blocked' ? 'red' : 'green' }}">{{ result() }}</p>
  `
})
export class Ex27 {
  dirty = signal(false);
  result = signal('');
  tryLeave() {
    if (this.dirty()) {
      this.result.set('blocked – form is dirty');
    } else {
      this.result.set('navigation allowed');
    }
  }
}

// ── Ex28 – Route canMatch ─────────────────────────────────────────────────
@Component({
  selector: 'ex-28', standalone: true, template: `
    <p>canMatch determines if a route should even be considered for matching.</p>
    <pre>{{ '{' }}
  path: 'dashboard',
  component: AdminDashboard,
  canMatch: [isAdminFn]
{{ '}' }},
{{ '{' }}
  path: 'dashboard',
  component: UserDashboard  // fallback if canMatch fails
{{ '}' }}</pre>
  `
})
export class Ex28 {}

// ── Ex29 – withViewTransitions ────────────────────────────────────────────
@Component({
  selector: 'ex-29', standalone: true, template: `
    <p>withViewTransitions enables the View Transitions API for route animations.</p>
    <pre>provideRouter(routes, withViewTransitions())
// or with custom handler:
withViewTransitions({{ '{' }}
  onViewTransitionCreated: ({ transition }) => {{ '{' }}
    // customise transition
  {{ '}' }}
{{ '}' }})</pre>
  `
})
export class Ex29 {}

// ── Ex30 – withScrollRestoration ──────────────────────────────────────────
@Component({
  selector: 'ex-30', standalone: true, template: `
    <p>withScrollRestoration restores scroll position on browser back/forward.</p>
    <pre>provideRouter(routes, withScrollRestoration())</pre>
    <p>Also supports: scrollPositionRestoration: 'enabled' | 'top' | 'disabled'</p>
  `
})
export class Ex30 {}

// ── Ex31 – withPreloading ─────────────────────────────────────────────────
@Component({
  selector: 'ex-31', standalone: true, template: `
    <p>withPreloading configures a preloading strategy for lazy routes.</p>
    <pre>provideRouter(routes, withPreloading(PreloadAllModules))
// or custom:
provideRouter(routes, withPreloading(myCustomStrategy))</pre>
  `
})
export class Ex31 {}

// ── Ex32 – withDebugTracing ───────────────────────────────────────────────
@Component({
  selector: 'ex-32', standalone: true, template: `
    <p>withDebugTracing logs all router events to the console.</p>
    <pre>provideRouter(routes, withDebugTracing())
// Only use in development!</pre>
  `
})
export class Ex32 {}

// ── Ex33 – withComponentInputBinding ──────────────────────────────────────
@Component({
  selector: 'ex-33', standalone: true, template: `
    <p>withComponentInputBinding maps route params/data/queryParams to @Input().</p>
    <pre>provideRouter(routes, withComponentInputBinding())

// Component:
@Input() id!: string;        // from :id param
@Input() page!: string;      // from ?page queryParam
@Input() title!: string;     // from route data</pre>
  `
})
export class Ex33 {}

// ── Ex34 – provideRouter basic pattern ────────────────────────────────────
@Component({
  selector: 'ex-34', standalone: true, template: `
    <p>provideRouter is used in bootstrapApplication providers.</p>
    <pre>bootstrapApplication(AppComponent, {{ '{' }}
  providers: [
    provideRouter(appRoutes)
  ]
{{ '}' }});</pre>
  `
})
export class Ex34 {}

// ── Ex35 – provideRouter with multiple features ────────────────────────────
@Component({
  selector: 'ex-35', standalone: true, template: `
    <p>Multiple router features can be combined.</p>
    <pre>provideRouter(
  routes,
  withPreloading(PreloadAllModules),
  withComponentInputBinding(),
  withViewTransitions(),
  withScrollRestoration(),
  withDebugTracing()  // dev only
)</pre>
  `
})
export class Ex35 {}

// ── Ex36 – RouterLink with routerLinkActiveOptions ────────────────────────
@Component({
  selector: 'ex-36', standalone: true, template: `
    <p>routerLinkActiveOptions: exact prevents partial matching.</p>
    <pre>&lt;a routerLink="/home"
   routerLinkActive="active"
   [routerLinkActiveOptions]="{ exact: true }"&gt;Home&lt;/a&gt;</pre>
    <p>Without exact, /home/details would also activate /home link.</p>
  `
})
export class Ex36 {}

// ── Ex37 – Absolute vs relative RouterLink ────────────────────────────────
@Component({
  selector: 'ex-37', standalone: true, template: `
    <p>Absolute RouterLink starts with '/'; relative does not.</p>
    <pre>&lt;!-- Absolute (always from root) --&gt;
&lt;a routerLink="/products"&gt;Products&lt;/a&gt;

&lt;!-- Relative (from current route) --&gt;
&lt;a routerLink="./detail"&gt;Detail&lt;/a&gt;
&lt;a routerLink="../sibling"&gt;Sibling&lt;/a&gt;</pre>
  `
})
export class Ex37 {}

// ── Ex38 – navigate() with relativeTo ─────────────────────────────────────
@Component({
  selector: 'ex-38', standalone: true, template: `
    <p>relativeTo makes navigate() relative to a specific ActivatedRoute.</p>
    <pre>this.router.navigate(['detail'], {{ '{' }}
  relativeTo: this.route  // inject(ActivatedRoute)
{{ '}' }});</pre>
  `
})
export class Ex38 {}

// ── Ex39 – Router isActive ────────────────────────────────────────────────
@Component({
  selector: 'ex-39', standalone: true, template: `
    <p>router.isActive() checks if a URL matches the current route.</p>
    <pre>const active = this.router.isActive('/home', {{ '{' }}
  paths: 'exact', queryParams: 'exact',
  fragment: 'ignored', matrixParams: 'ignored'
{{ '}' }});</pre>
    <p>Sim: is '/home' active? {{ isHomeActive() }}</p>
    <button (click)="simUrl.set('/home')">Go /home</button>
    <button (click)="simUrl.set('/about')">Go /about</button>
  `
})
export class Ex39 {
  simUrl = simUrl;
  isHomeActive = computed(() => this.simUrl() === '/home');
}

// ── Ex40 – Route state with extras ────────────────────────────────────────
@Component({
  selector: 'ex-40', standalone: true, template: `
    <p>Pass state via navigate extras; read via router.getCurrentNavigation().</p>
    <pre>router.navigate(['/confirm'], {{ '{' }}
  state: {{ '{' }} orderId: 123, total: 99.99 {{ '}' }}
{{ '}' }});

// In target component:
const nav = this.router.getCurrentNavigation();
const orderId = nav?.extras?.state?.['orderId'];</pre>
  `
})
export class Ex40 {}

// ── Ex41 – NavigationEnd event filter ────────────────────────────────────
@Component({
  selector: 'ex-41', standalone: true, template: `
    <p>Filter router events to react only to NavigationEnd.</p>
    <pre>router.events.pipe(
  filter((e): e is NavigationEnd => e instanceof NavigationEnd)
).subscribe(e => this.currentUrl.set(e.urlAfterRedirects));</pre>
    <p>Event count (simulated): {{ count() }}</p>
    <button (click)="count.update(n => n + 1)">Simulate NavigationEnd</button>
  `
})
export class Ex41 { count = signal(0); }

// ── Ex42 – RoutesRecognized event ─────────────────────────────────────────
@Component({
  selector: 'ex-42', standalone: true, template: `
    <p>RoutesRecognized fires after router matches URL to route config.</p>
    <pre>router.events.pipe(
  filter(e => e instanceof RoutesRecognized)
).subscribe(e => console.log('routes matched for:', e.url));</pre>
  `
})
export class Ex42 {}

// ── Ex43 – Router outlet name (named outlets intro) ───────────────────────
@Component({
  selector: 'ex-43', standalone: true, template: `
    <p>Named outlets allow multiple router-outlets on one page.</p>
    <pre>&lt;router-outlet /&gt;           &lt;!-- primary --&gt;
&lt;router-outlet name="sidebar" /&gt;  &lt;!-- named --&gt;

// Route:
{{ '{' }} path: 'help', component: HelpComponent, outlet: 'sidebar' {{ '}' }}</pre>
  `
})
export class Ex43 {}

// ── Ex44 – Lazy route with data + title ───────────────────────────────────
@Component({
  selector: 'ex-44', standalone: true, template: `
    <p>Lazy routes can also have title, data, guards, and resolvers.</p>
    <pre>{{ '{' }}
  path: 'billing',
  title: 'Billing',
  data: {{ '{' }} icon: 'credit-card' {{ '}' }},
  canActivate: [authGuard],
  loadComponent: () => import('./billing.component')
    .then(m => m.BillingComponent)
{{ '}' }}</pre>
  `
})
export class Ex44 {}

// ── Ex45 – Route order matters ────────────────────────────────────────────
@Component({
  selector: 'ex-45', standalone: true, template: `
    <p>Router matches routes in declaration order — specific before wildcard.</p>
    <pre>const routes: Routes = [
  {{ '{' }} path: 'users/new', component: NewUserComponent {{ '}' }},   // specific first
  {{ '{' }} path: 'users/:id', component: UserDetailComponent {{ '}' }},
  {{ '{' }} path: 'users',     component: UserListComponent {{ '}' }},
  {{ '{' }} path: '**',        component: NotFoundComponent {{ '}' }},  // last
];</pre>
  `
})
export class Ex45 {}

// ── Ex46 – withEnabledBlockingInitialNavigation ───────────────────────────
@Component({
  selector: 'ex-46', standalone: true, template: `
    <p>withEnabledBlockingInitialNavigation is used for SSR to block initial render until nav completes.</p>
    <pre>provideRouter(routes, withEnabledBlockingInitialNavigation())</pre>
    <p>On CSR apps, use withDisabledInitialNavigation() if you control nav manually.</p>
  `
})
export class Ex46 {}

// ── Ex47 – RouterLink on non-anchor elements ──────────────────────────────
@Component({
  selector: 'ex-47', standalone: true, template: `
    <p>RouterLink can be placed on any element, not just &lt;a&gt;.</p>
    <pre>&lt;button routerLink="/checkout"&gt;Checkout&lt;/button&gt;
&lt;div routerLink="/home" style="cursor:pointer"&gt;Home&lt;/div&gt;</pre>
  `
})
export class Ex47 {}

// ── Ex48 – isActive CSS class simulation ─────────────────────────────────
@Component({
  selector: 'ex-48', standalone: true, template: `
    <p>Simulate active link highlighting based on current URL.</p>
    <nav style="display:flex;gap:8px">
      @for (link of links; track link.path) {
        <a href="#"
           (click)="$event.preventDefault(); navigate(link.path)"
           [style.fontWeight]="isActive(link.path) ? 'bold' : 'normal'"
           [style.color]="isActive(link.path) ? '#1976d2' : 'inherit'">
          {{ link.label }}
        </a>
      }
    </nav>
    <p>Current: {{ url() }}</p>
  `
})
export class Ex48 {
  url = simUrl;
  links = [
    { path: '/home', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/products', label: 'Products' },
  ];
  navigate(p: string) { simNavigate(p); }
  isActive(p: string) { return this.url() === p; }
}

// ── Ex49 – Full provideRouter patterns summary ────────────────────────────
@Component({
  selector: 'ex-49', standalone: true, template: `
    <p>All major provideRouter feature functions at a glance:</p>
    <pre>provideRouter(routes,
  withHashLocation(),            // hash URLs
  withPreloading(strategy),      // preload strategy
  withDebugTracing(),            // console event log
  withComponentInputBinding(),   // params → @Input
  withViewTransitions(),         // View Transitions API
  withScrollRestoration(),       // restore scroll
  withEnabledBlockingInitialNavigation(), // SSR
  withRouterConfig({{ '{' }} ... {{ '}' }})  // fine-grained config
)</pre>
  `
})
export class Ex49 {}

// ── Ex50 – Interactive mini-router simulation ─────────────────────────────
@Component({
  selector: 'ex-50', standalone: true, template: `
    <p>Full mini router simulation with history.</p>
    <nav style="display:flex;gap:8px;flex-wrap:wrap">
      @for (r of routes; track r) {
        <button (click)="go(r)">{{ r }}</button>
      }
    </nav>
    <div style="margin-top:8px;padding:8px;border:1px solid #ccc;border-radius:4px">
      <strong>Current route:</strong> {{ current() }}<br>
      <strong>History:</strong> {{ history().join(' → ') }}
    </div>
  `
})
export class Ex50 {
  routes = ['/home', '/about', '/products', '/products/1', '/users/42', '/not-found'];
  current = signal('/home');
  history = signal<string[]>(['/home']);
  go(path: string) {
    this.current.set(path);
    this.history.update(h => [...h.slice(-4), path]);
    simNavigate(path);
  }
}

// ── AppComponent ──────────────────────────────────────────────────────────
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
    <div style="font-family:sans-serif;max-width:860px;margin:0 auto;padding:20px">
      <h1>Phase 6 – Router Basics Examples</h1>

      <h4>Ex01 – RouterLink concept</h4><ex-01 /><hr />
      <h4>Ex02 – RouterLinkActive concept</h4><ex-02 /><hr />
      <h4>Ex03 – RouterOutlet concept</h4><ex-03 /><hr />
      <h4>Ex04 – router.navigate()</h4><ex-04 /><hr />
      <h4>Ex05 – router.navigateByUrl()</h4><ex-05 /><hr />
      <h4>Ex06 – Router events (NavigationStart/End)</h4><ex-06 /><hr />
      <h4>Ex07 – URL construction with RouterLink array</h4><ex-07 /><hr />
      <h4>Ex08 – RouterLink with queryParams</h4><ex-08 /><hr />
      <h4>Ex09 – RouterLink with fragment</h4><ex-09 /><hr />
      <h4>Ex10 – skipLocationChange</h4><ex-10 /><hr />
      <h4>Ex11 – replaceUrl</h4><ex-11 /><hr />
      <h4>Ex12 – router.url</h4><ex-12 /><hr />
      <h4>Ex13 – navigate() extras: queryParamsHandling</h4><ex-13 /><hr />
      <h4>Ex14 – withHashLocation</h4><ex-14 /><hr />
      <h4>Ex15 – withBrowserHistoryLocation (default)</h4><ex-15 /><hr />
      <h4>Ex16 – Route config structure</h4><ex-16 /><hr />
      <h4>Ex17 – pathMatch: 'full'</h4><ex-17 /><hr />
      <h4>Ex18 – redirectTo</h4><ex-18 /><hr />
      <h4>Ex19 – Wildcard ** route</h4><ex-19 /><hr />
      <h4>Ex20 – children array</h4><ex-20 /><hr />
      <h4>Ex21 – loadComponent (lazy standalone)</h4><ex-21 /><hr />
      <h4>Ex22 – loadChildren (lazy routes)</h4><ex-22 /><hr />
      <h4>Ex23 – Route title</h4><ex-23 /><hr />
      <h4>Ex24 – Route data (static)</h4><ex-24 /><hr />
      <h4>Ex25 – Route resolve</h4><ex-25 /><hr />
      <h4>Ex26 – Route canActivate</h4><ex-26 /><hr />
      <h4>Ex27 – Route canDeactivate</h4><ex-27 /><hr />
      <h4>Ex28 – Route canMatch</h4><ex-28 /><hr />
      <h4>Ex29 – withViewTransitions</h4><ex-29 /><hr />
      <h4>Ex30 – withScrollRestoration</h4><ex-30 /><hr />
      <h4>Ex31 – withPreloading</h4><ex-31 /><hr />
      <h4>Ex32 – withDebugTracing</h4><ex-32 /><hr />
      <h4>Ex33 – withComponentInputBinding</h4><ex-33 /><hr />
      <h4>Ex34 – provideRouter basic pattern</h4><ex-34 /><hr />
      <h4>Ex35 – provideRouter with multiple features</h4><ex-35 /><hr />
      <h4>Ex36 – routerLinkActiveOptions exact</h4><ex-36 /><hr />
      <h4>Ex37 – Absolute vs relative RouterLink</h4><ex-37 /><hr />
      <h4>Ex38 – navigate() with relativeTo</h4><ex-38 /><hr />
      <h4>Ex39 – router.isActive()</h4><ex-39 /><hr />
      <h4>Ex40 – Route state with extras</h4><ex-40 /><hr />
      <h4>Ex41 – NavigationEnd event filter</h4><ex-41 /><hr />
      <h4>Ex42 – RoutesRecognized event</h4><ex-42 /><hr />
      <h4>Ex43 – Named router outlets intro</h4><ex-43 /><hr />
      <h4>Ex44 – Lazy route with data + title</h4><ex-44 /><hr />
      <h4>Ex45 – Route order matters</h4><ex-45 /><hr />
      <h4>Ex46 – withEnabledBlockingInitialNavigation</h4><ex-46 /><hr />
      <h4>Ex47 – RouterLink on non-anchor elements</h4><ex-47 /><hr />
      <h4>Ex48 – Active link simulation</h4><ex-48 /><hr />
      <h4>Ex49 – provideRouter feature summary</h4><ex-49 /><hr />
      <h4>Ex50 – Interactive mini-router simulation</h4><ex-50 /><hr />
    </div>
  `
})
export class AppComponent {}
