import { Component, signal, computed } from '@angular/core';

// ============================================================
// Examples 4.4 — Nested Routes (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. children array config — show route structure in <pre> tag
@Component({
  selector: 'ex-01', standalone: true,
  template: `
    <p><strong>children array in Route config:</strong></p>
    <pre>
const routes: Routes = [
  {{ '{' }}
    path: 'dashboard',
    component: DashboardComponent,
    children: [
      {{ '{' }} path: 'overview', component: OverviewComponent {{ '}' }},
      {{ '{' }} path: 'stats', component: StatsComponent {{ '}' }},
      {{ '{' }} path: '', redirectTo: 'overview', pathMatch: 'full' {{ '}' }}
    ]
  {{ '}' }}
];</pre>
    <p>The <code>children</code> array nests routes under a parent path segment.</p>
  `
})
class Ex01 {}

// 2. Nested router-outlet concept — explain with diagram in template
@Component({
  selector: 'ex-02', standalone: true,
  template: `
    <p><strong>Nested router-outlet:</strong> A child component must contain its own <code>&lt;router-outlet&gt;</code> to render child routes.</p>
    <pre>
/* Parent component template */
&lt;nav&gt;
  &lt;a routerLink="overview"&gt;Overview&lt;/a&gt;
  &lt;a routerLink="stats"&gt;Stats&lt;/a&gt;
&lt;/nav&gt;
&lt;router-outlet /&gt;  &lt;!-- child routes render here --&gt;</pre>
    <p>URL: <code>/dashboard/overview</code> → DashboardComponent hosts OverviewComponent inside its outlet.</p>
  `
})
class Ex02 {}

// 3. Default child path '' — code pattern display
@Component({
  selector: 'ex-03', standalone: true,
  template: `
    <p><strong>Default child route (empty path ''):</strong></p>
    <pre>
children: [
  {{ '{' }} path: 'overview', component: OverviewComponent {{ '}' }},
  {{ '{' }} path: '',          redirectTo: 'overview', pathMatch: 'full' {{ '}' }}
]</pre>
    <p>Navigating to <code>/dashboard</code> automatically redirects to <code>/dashboard/overview</code>.</p>
  `
})
class Ex03 {}

// 4. Redirect child route — code pattern display
@Component({
  selector: 'ex-04', standalone: true,
  template: `
    <p><strong>Redirect child route:</strong></p>
    <pre>
{{ '{' }} path: 'old-stats', redirectTo: 'stats' {{ '}' }},
{{ '{' }} path: 'stats',     component: StatsComponent {{ '}' }}</pre>
    <p>Use <code>redirectTo</code> inside children to handle renamed or legacy paths.</p>
  `
})
class Ex04 {}

// 5. pathMatch: 'full' vs 'prefix' — comparison display
@Component({
  selector: 'ex-05', standalone: true,
  template: `
    <p><strong>pathMatch: 'full' vs 'prefix':</strong></p>
    <table style="border-collapse:collapse;font-size:13px">
      <tr style="background:#eee">
        <th style="padding:4px 8px;border:1px solid #ccc">pathMatch</th>
        <th style="padding:4px 8px;border:1px solid #ccc">URL</th>
        <th style="padding:4px 8px;border:1px solid #ccc">Matches?</th>
      </tr>
      <tr>
        <td style="padding:4px 8px;border:1px solid #ccc">'full'</td>
        <td style="padding:4px 8px;border:1px solid #ccc">/</td>
        <td style="padding:4px 8px;border:1px solid #ccc">only exact ''</td>
      </tr>
      <tr>
        <td style="padding:4px 8px;border:1px solid #ccc">'prefix'</td>
        <td style="padding:4px 8px;border:1px solid #ccc">/anything</td>
        <td style="padding:4px 8px;border:1px solid #ccc">any path starting with ''</td>
      </tr>
    </table>
    <p>Always use <code>pathMatch: 'full'</code> with empty path redirects to avoid matching everything.</p>
  `
})
class Ex05 {}

// 6. componentless parent route — code pattern
@Component({
  selector: 'ex-06', standalone: true,
  template: `
    <p><strong>Componentless parent route (layout group without a component):</strong></p>
    <pre>
{{ '{' }}
  path: 'admin',          // no component here
  canActivate: [AuthGuard],
  children: [
    {{ '{' }} path: 'users',    component: UsersComponent {{ '}' }},
    {{ '{' }} path: 'settings', component: SettingsComponent {{ '}' }}
  ]
{{ '}' }}</pre>
    <p>Useful for applying guards/resolvers to a group of routes without a wrapper layout component.</p>
  `
})
class Ex06 {}

// 7. Named outlet concept — code display
@Component({
  selector: 'ex-07', standalone: true,
  template: `
    <p><strong>Named router-outlet:</strong></p>
    <pre>
/* In template: */
&lt;router-outlet /&gt;              &lt;!-- primary --&gt;
&lt;router-outlet name="sidebar" /&gt;  &lt;!-- named --&gt;

/* In route config: */
{{ '{' }}
  path: 'compose',
  component: ComposeComponent,
  outlet: 'sidebar'
{{ '}' }}

/* RouterLink: */
[routerLink]="[{{ '{' }} outlets: {{ '{' }} sidebar: ['compose'] {{ '}' }} {{ '}' }}]"</pre>
  `
})
class Ex07 {}

// 8. Relative RouterLink ./child — simulated with signal nav state
@Component({
  selector: 'ex-08', standalone: true,
  template: `
    <p><strong>Relative RouterLink ./child:</strong></p>
    <pre>
&lt;!-- Inside DashboardComponent template --&gt;
&lt;a routerLink="./overview"&gt;Overview&lt;/a&gt;
&lt;!-- or --&gt;
&lt;a [routerLink]="['./overview']"&gt;Overview&lt;/a&gt;</pre>
    <p>The <code>./</code> prefix means relative to the <em>current</em> route's URL segment.</p>
    <p>Simulated nav: <strong>{{ navState() }}</strong></p>
    <button (click)="navigate()">Simulate ./overview</button>
  `,
})
class Ex08 {
  navState = signal('(none)');
  navigate() { this.navState.set('/dashboard/overview'); }
}

// 9. Relative RouterLink ../sibling — simulated
@Component({
  selector: 'ex-09', standalone: true,
  template: `
    <p><strong>Relative RouterLink ../sibling:</strong></p>
    <pre>
&lt;!-- Inside /dashboard/overview --&gt;
&lt;a routerLink="../stats"&gt;Go to Stats&lt;/a&gt;
&lt;!-- resolves to /dashboard/stats --&gt;</pre>
    <p>The <code>../</code> prefix moves up one URL segment before appending the sibling.</p>
    <p>Simulated nav: <strong>{{ navState() }}</strong></p>
    <button (click)="navigate()">Simulate ../stats</button>
  `,
})
class Ex09 {
  navState = signal('currently at /dashboard/overview');
  navigate() { this.navState.set('navigated to /dashboard/stats'); }
}

// 10. ActivatedRoute parent params — code display
@Component({
  selector: 'ex-10', standalone: true,
  template: `
    <p><strong>Accessing parent route params from a child:</strong></p>
    <pre>
// In a child component that needs :id from parent path /items/:id/detail
constructor(private route: ActivatedRoute) {{ '{' }}
  // Option 1: traverse to parent
  this.route.parent?.params.subscribe(p => console.log(p['id']));

  // Option 2: enable param inheritance in router config
  // provideRouter(routes, withRouterConfig({{ '{' }} paramsInheritanceStrategy: 'always' {{ '}' }}))
  this.route.params.subscribe(p => console.log(p['id']));
{{ '}' }}</pre>
  `
})
class Ex10 {}

// 11. Route data on child — code display
@Component({
  selector: 'ex-11', standalone: true,
  template: `
    <p><strong>Static data on child route:</strong></p>
    <pre>
children: [
  {{ '{' }}
    path: 'settings',
    component: SettingsComponent,
    data: {{ '{' }} title: 'Settings', breadcrumb: 'Settings' {{ '}' }}
  {{ '}' }}
]

// In SettingsComponent:
this.route.data.subscribe(d => this.title = d['title']);</pre>
  `
})
class Ex11 {}

// 12. Children with canActivate — code display
@Component({
  selector: 'ex-12', standalone: true,
  template: `
    <p><strong>canActivate on individual child routes:</strong></p>
    <pre>
children: [
  {{ '{' }}
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard]   // functional guard
  {{ '}' }},
  {{ '{' }}
    path: 'profile',
    component: ProfileComponent
    // no guard — public
  {{ '}' }}
]</pre>
    <p>Each child can have its own guard independent of siblings.</p>
  `
})
class Ex12 {}

// 13. Children with resolve — code display
@Component({
  selector: 'ex-13', standalone: true,
  template: `
    <p><strong>resolve on child routes:</strong></p>
    <pre>
children: [
  {{ '{' }}
    path: 'detail/:id',
    component: DetailComponent,
    resolve: {{ '{' }} item: itemResolver {{ '}' }}
  {{ '}' }}
]

// itemResolver (functional):
export const itemResolver: ResolveFn&lt;Item&gt; =
  (route) => inject(ItemService).getById(route.params['id']);</pre>
  `
})
class Ex13 {}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────

// 14. Tab interface simulated with signal (3 tabs, content switches)
@Component({
  selector: 'ex-14', standalone: true,
  template: `
    <p><strong>Tab interface (simulated nested route tabs):</strong></p>
    <div style="display:flex;gap:8px;margin-bottom:8px">
      @for (tab of tabs; track tab) {
        <button
          [style.fontWeight]="activeTab() === tab ? 'bold' : 'normal'"
          [style.borderBottom]="activeTab() === tab ? '2px solid #007bff' : 'none'"
          (click)="activeTab.set(tab)">
          {{ tab }}
        </button>
      }
    </div>
    @if (activeTab() === 'Overview') { <div>Overview content — /dashboard/overview</div> }
    @if (activeTab() === 'Stats') { <div>Stats content — /dashboard/stats</div> }
    @if (activeTab() === 'Reports') { <div>Reports content — /dashboard/reports</div> }
  `
})
class Ex14 {
  tabs = ['Overview', 'Stats', 'Reports'];
  activeTab = signal('Overview');
}

// 15. Settings page with sub-sections (simulated with signal routing)
@Component({
  selector: 'ex-15', standalone: true,
  template: `
    <p><strong>Settings nested sections:</strong></p>
    <div style="display:flex;gap:16px">
      <div style="min-width:100px">
        @for (section of sections; track section) {
          <div
            [style.fontWeight]="active() === section ? 'bold' : 'normal'"
            style="cursor:pointer;padding:4px"
            (click)="active.set(section)">
            {{ section }}
          </div>
        }
      </div>
      <div style="flex:1;padding:8px;background:#f5f5f5">
        <strong>{{ active() }}</strong>
        <p>Content for /settings/{{ active().toLowerCase() }}</p>
      </div>
    </div>
  `
})
class Ex15 {
  sections = ['Profile', 'Security', 'Notifications', 'Billing'];
  active = signal('Profile');
}

// 16. Dashboard nested sections (simulated)
@Component({
  selector: 'ex-16', standalone: true,
  template: `
    <p><strong>Dashboard nested sections (simulated router):</strong></p>
    <div style="display:flex;gap:12px">
      <aside style="min-width:90px">
        @for (s of sections; track s.key) {
          <div style="cursor:pointer;padding:4px" [style.color]="active() === s.key ? '#007bff' : '#333'"
            (click)="active.set(s.key)">{{ s.label }}</div>
        }
      </aside>
      <main style="flex:1;background:#f9f9f9;padding:8px">
        <em>/dashboard/{{ active() }}</em>
        <p>{{ content() }}</p>
      </main>
    </div>
  `
})
class Ex16 {
  sections = [
    { key: 'overview', label: 'Overview' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'users', label: 'Users' },
  ];
  active = signal('overview');
  content = computed(() => ({
    overview: 'Key metrics at a glance.',
    analytics: 'Charts and trend data.',
    users: 'Registered user management.',
  }[this.active()] ?? ''));
}

// 17. Auth layout route pattern — code + signal demo
@Component({
  selector: 'ex-17', standalone: true,
  template: `
    <p><strong>Auth layout route pattern:</strong></p>
    <pre>
{{ '{' }}
  path: '',
  component: AuthLayoutComponent,   // centered card layout
  children: [
    {{ '{' }} path: 'login',    component: LoginComponent {{ '}' }},
    {{ '{' }} path: 'register', component: RegisterComponent {{ '}' }},
    {{ '{' }} path: 'forgot',   component: ForgotPasswordComponent {{ '}' }}
  ]
{{ '}' }}</pre>
    <p>Active page: <strong>{{ page() }}</strong></p>
    <div style="display:flex;gap:8px">
      @for (p of pages; track p) {
        <button (click)="page.set(p)">{{ p }}</button>
      }
    </div>
  `
})
class Ex17 {
  pages = ['login', 'register', 'forgot'];
  page = signal('login');
}

// 18. 3-level nesting structure — code display
@Component({
  selector: 'ex-18', standalone: true,
  template: `
    <p><strong>3-level route nesting:</strong></p>
    <pre>
/app
  /admin                    → AdminShellComponent
    /users                  → UsersListComponent
      /:userId              → UserDetailComponent
        /activity           → UserActivityComponent
        /settings           → UserSettingsComponent</pre>
    <pre>
{{ '{' }} path: 'admin', component: AdminShellComponent, children: [
  {{ '{' }} path: 'users', component: UsersListComponent, children: [
    {{ '{' }} path: ':userId', component: UserDetailComponent, children: [
      {{ '{' }} path: 'activity', component: UserActivityComponent {{ '}' }},
      {{ '{' }} path: 'settings', component: UserSettingsComponent {{ '}' }}
    ]}
  ]}
]}</pre>
  `
})
class Ex18 {}

// 19. Route data inheritance — code display
@Component({
  selector: 'ex-19', standalone: true,
  template: `
    <p><strong>Route data inheritance:</strong></p>
    <pre>
// By default, child routes do NOT inherit parent data.
// Enable with:
provideRouter(routes, withRouterConfig({{
  '{' }} paramsInheritanceStrategy: 'always' {{ '}' }}))

// Or traverse manually:
this.route.data.subscribe(d => ...);      // child's own data
this.route.parent?.data.subscribe(d => ...); // parent's data</pre>
  `
})
class Ex19 {}

// 20. Param inheritance (inheritParamData) — code display
@Component({
  selector: 'ex-20', standalone: true,
  template: `
    <p><strong>Param inheritance with paramsInheritanceStrategy:</strong></p>
    <pre>
// Default: 'emptyOnly' — child inherits params only if it has empty path
// 'always' — child always inherits parent path params + queryParams + data

provideRouter(routes, withRouterConfig({{
  '{' }}
  paramsInheritanceStrategy: 'always'
{{ '}' }}))

// Now a child at /items/:id/detail can read :id directly:
inject(ActivatedRoute).params  // includes :id from parent</pre>
  `
})
class Ex20 {}

// 21. Children with own guards — code display
@Component({
  selector: 'ex-21', standalone: true,
  template: `
    <p><strong>Each child route with its own guard:</strong></p>
    <pre>
children: [
  {{ '{' }} path: 'public',  component: PublicPage {{ '}' }},
  {{ '{' }} path: 'private', component: PrivatePage, canActivate: [authGuard] {{ '}' }},
  {{ '{' }} path: 'admin',   component: AdminPage,
    canActivate: [authGuard, roleGuard('admin')] {{ '}' }}
]</pre>
    <p>Guards on children are evaluated <em>after</em> any parent guards pass.</p>
  `
})
class Ex21 {}

// 22. Children with own resolvers — code display
@Component({
  selector: 'ex-22', standalone: true,
  template: `
    <p><strong>Children with own resolvers:</strong></p>
    <pre>
children: [
  {{ '{' }}
    path: ':postId',
    component: PostDetailComponent,
    resolve: {{ '{' }} post: postResolver {{ '}' }},
    children: [
      {{ '{' }}
        path: 'comments',
        component: CommentsComponent,
        resolve: {{ '{' }} comments: commentsResolver {{ '}' }}
      {{ '}' }}
    ]
  {{ '}' }}
]
// /blog/42/comments → resolves post(42) then comments(42)</pre>
  `
})
class Ex22 {}

// 23. Children with different titles — code display
@Component({
  selector: 'ex-23', standalone: true,
  template: `
    <p><strong>Per-child route titles (Angular 14+):</strong></p>
    <pre>
children: [
  {{ '{' }} path: 'overview', component: OverviewComponent,
    title: 'Dashboard — Overview' {{ '}' }},
  {{ '{' }} path: 'stats',    component: StatsComponent,
    title: 'Dashboard — Stats' {{ '}' }},
  {{ '{' }} path: 'reports',  component: ReportsComponent,
    title: reportsTitle  // TitleStrategy or ResolveFn&lt;string&gt;
  {{ '}' }}
]</pre>
    <p>The <code>title</code> property updates <code>document.title</code> automatically via <code>TitleStrategy</code>.</p>
  `
})
class Ex23 {}

// 24. canActivateChild concept — code display
@Component({
  selector: 'ex-24', standalone: true,
  template: `
    <p><strong>canActivateChild — guard runs for every child activation:</strong></p>
    <pre>
{{ '{' }}
  path: 'admin',
  component: AdminShellComponent,
  canActivateChild: [authGuard],  // runs before each child route activates
  children: [
    {{ '{' }} path: 'users',    component: UsersComponent {{ '}' }},
    {{ '{' }} path: 'settings', component: SettingsComponent {{ '}' }}
  ]
{{ '}' }}</pre>
    <p><code>canActivateChild</code> is called whenever navigating <em>between</em> child routes too, unlike <code>canActivate</code> which only fires when the parent activates.</p>
  `
})
class Ex24 {}

// 25. Empty path children setup — code display
@Component({
  selector: 'ex-25', standalone: true,
  template: `
    <p><strong>Empty path children (layout wrapper pattern):</strong></p>
    <pre>
{{ '{' }}
  path: '',             // matches root ''
  component: AppShellComponent,
  children: [
    {{ '{' }} path: '',       component: HomeComponent, pathMatch: 'full' {{ '}' }},
    {{ '{' }} path: 'about',  component: AboutComponent {{ '}' }},
    {{ '{' }} path: 'blog',   component: BlogComponent {{ '}' }}
  ]
{{ '}' }}</pre>
    <p>The shell component provides header/footer; children render inside its <code>&lt;router-outlet&gt;</code>.</p>
  `
})
class Ex25 {}

// 26. Multi-level relative navigation — code display
@Component({
  selector: 'ex-26', standalone: true,
  template: `
    <p><strong>Multi-level relative navigation programmatically:</strong></p>
    <pre>
// Currently at /admin/users/42/activity
// Navigate to sibling: /admin/users/42/settings
this.router.navigate(['../settings'], {{ '{' }} relativeTo: this.route {{ '}' }});

// Navigate to parent list: /admin/users
this.router.navigate(['../../'], {{ '{' }} relativeTo: this.route {{ '}' }});

// Navigate to cousin: /admin/posts
this.router.navigate(['../../../posts'], {{ '{' }} relativeTo: this.route {{ '}' }});</pre>
  `
})
class Ex26 {}

// ─── NESTED (27–38) ──────────────────────────────────────────

// 27. Full dashboard: sidebar menu + content area (signal-driven)
@Component({
  selector: 'ex-27', standalone: true,
  template: `
    <p><strong>Full dashboard (signal-driven nested route simulation):</strong></p>
    <div style="display:flex;gap:0;border:1px solid #ddd;font-size:13px">
      <aside style="background:#2d3748;color:#fff;min-width:110px;padding:8px">
        <div style="font-weight:bold;margin-bottom:8px">Dashboard</div>
        @for (item of menu; track item.key) {
          <div style="padding:4px 6px;cursor:pointer;border-radius:4px;margin:2px 0"
            [style.background]="active() === item.key ? '#4a5568' : 'transparent'"
            (click)="active.set(item.key)">
            {{ item.icon }} {{ item.label }}
          </div>
        }
      </aside>
      <main style="flex:1;padding:12px;background:#f7fafc">
        <h3 style="margin:0 0 8px">{{ currentItem().label }}</h3>
        <p>URL: <code>/dashboard/{{ active() }}</code></p>
        <p>{{ currentItem().desc }}</p>
      </main>
    </div>
  `
})
class Ex27 {
  menu = [
    { key: 'overview',  label: 'Overview',  icon: '📊', desc: 'Summary of all key metrics.' },
    { key: 'analytics', label: 'Analytics', icon: '📈', desc: 'Detailed charts and trends.' },
    { key: 'users',     label: 'Users',     icon: '👥', desc: 'User management.' },
    { key: 'settings',  label: 'Settings',  icon: '⚙️', desc: 'App configuration.' },
  ];
  active = signal('overview');
  currentItem = computed(() => this.menu.find(m => m.key === this.active())!);
}

// 28. E-commerce: product list → product detail → reviews (signal nav)
@Component({
  selector: 'ex-28', standalone: true,
  template: `
    <p><strong>E-commerce nested navigation (signal-driven):</strong></p>
    <div style="font-size:13px">
      <div style="margin-bottom:4px">
        Path: <code>/shop{{ pathSuffix() }}</code>
      </div>
      @if (view() === 'list') {
        <div>
          <strong>Products</strong>
          @for (p of products; track p.id) {
            <div style="cursor:pointer;color:#007bff" (click)="selectProduct(p.id)">
              → {{ p.name }}
            </div>
          }
        </div>
      }
      @if (view() === 'detail') {
        <div>
          <strong>{{ selectedProduct().name }}</strong> (id={{ selectedProductId() }})
          <div><button (click)="view.set('reviews')">See Reviews</button>
          <button (click)="view.set('list')">← Back</button></div>
        </div>
      }
      @if (view() === 'reviews') {
        <div>
          <strong>Reviews for {{ selectedProduct().name }}</strong>
          <ul>@for (r of reviews; track r) { <li>{{ r }}</li> }</ul>
          <button (click)="view.set('detail')">← Back to Detail</button>
        </div>
      }
    </div>
  `
})
class Ex28 {
  products = [
    { id: 1, name: 'Widget A' },
    { id: 2, name: 'Widget B' },
  ];
  reviews = ['Great product!', 'Works well.', '5 stars.'];
  view = signal<'list' | 'detail' | 'reviews'>('list');
  selectedProductId = signal(0);
  selectedProduct = computed(() => this.products.find(p => p.id === this.selectedProductId()) ?? { id: 0, name: '' });
  pathSuffix = computed(() => {
    if (this.view() === 'list') return '/products';
    if (this.view() === 'detail') return `/products/${this.selectedProductId()}`;
    return `/products/${this.selectedProductId()}/reviews`;
  });
  selectProduct(id: number) { this.selectedProductId.set(id); this.view.set('detail'); }
}

// 29. Blog: category list → post list → post detail (signal nav)
@Component({
  selector: 'ex-29', standalone: true,
  template: `
    <p><strong>Blog nested navigation:</strong></p>
    <div style="font-size:13px">
      <em>/blog{{ suffix() }}</em>
      @if (level() === 0) {
        <div>
          <strong>Categories</strong>
          @for (c of categories; track c) {
            <div style="cursor:pointer;color:#007bff" (click)="selectCat(c)">{{ c }}</div>
          }
        </div>
      }
      @if (level() === 1) {
        <div>
          <strong>Posts in {{ cat() }}</strong>
          @for (p of posts; track p) {
            <div style="cursor:pointer;color:#007bff" (click)="selectPost(p)">{{ p }}</div>
          }
          <button (click)="level.set(0)">← Categories</button>
        </div>
      }
      @if (level() === 2) {
        <div>
          <strong>{{ post() }}</strong>
          <p>Full post content here...</p>
          <button (click)="level.set(1)">← Posts</button>
        </div>
      }
    </div>
  `
})
class Ex29 {
  categories = ['Angular', 'React', 'Vue'];
  posts = ['Post One', 'Post Two', 'Post Three'];
  level = signal(0);
  cat = signal('');
  post = signal('');
  suffix = computed(() => {
    if (this.level() === 0) return '';
    if (this.level() === 1) return `/${this.cat().toLowerCase()}`;
    return `/${this.cat().toLowerCase()}/${this.post().toLowerCase().replace(/ /g, '-')}`;
  });
  selectCat(c: string) { this.cat.set(c); this.level.set(1); }
  selectPost(p: string) { this.post.set(p); this.level.set(2); }
}

// 30. Profile tabs: /activity /settings /friends (signal tabs)
@Component({
  selector: 'ex-30', standalone: true,
  template: `
    <p><strong>Profile page with nested tab routes:</strong></p>
    <div style="font-size:13px">
      <div style="background:#e2e8f0;padding:8px;border-radius:4px 4px 0 0">
        <strong>Profile: Alice</strong> — <em>/profile{{ suffix() }}</em>
      </div>
      <div style="display:flex;gap:0;border-bottom:2px solid #cbd5e0">
        @for (tab of tabs; track tab.key) {
          <div style="padding:6px 12px;cursor:pointer"
            [style.borderBottom]="active() === tab.key ? '2px solid #4299e1' : 'none'"
            [style.color]="active() === tab.key ? '#4299e1' : '#718096'"
            (click)="active.set(tab.key)">
            {{ tab.label }}
          </div>
        }
      </div>
      <div style="padding:8px;background:#fff">
        @if (active() === 'activity') { <p>Recent activity items...</p> }
        @if (active() === 'settings') { <p>Account settings form...</p> }
        @if (active() === 'friends') { <p>Friends list...</p> }
      </div>
    </div>
  `
})
class Ex30 {
  tabs = [
    { key: 'activity', label: 'Activity' },
    { key: 'settings', label: 'Settings' },
    { key: 'friends',  label: 'Friends' },
  ];
  active = signal('activity');
  suffix = computed(() => `/${this.active()}`);
}

// 31. Admin panel: /users /posts /settings (signal nav)
@Component({
  selector: 'ex-31', standalone: true,
  template: `
    <p><strong>Admin panel nested routes:</strong></p>
    <div style="display:flex;font-size:13px;border:1px solid #e2e8f0">
      <nav style="background:#1a202c;color:#e2e8f0;width:100px;padding:8px">
        <div style="font-size:11px;color:#718096;margin-bottom:6px">ADMIN</div>
        @for (item of nav; track item.key) {
          <div style="padding:5px 4px;cursor:pointer;border-radius:3px"
            [style.background]="active() === item.key ? '#2d3748' : 'transparent'"
            (click)="active.set(item.key)">
            {{ item.label }}
          </div>
        }
      </nav>
      <div style="flex:1;padding:10px">
        <div style="color:#718096;font-size:11px">/admin/{{ active() }}</div>
        <h4 style="margin:4px 0">{{ title() }}</h4>
        @if (active() === 'users') { <p>User table with search/filter.</p> }
        @if (active() === 'posts') { <p>All posts with moderation actions.</p> }
        @if (active() === 'settings') { <p>Global app configuration.</p> }
      </div>
    </div>
  `
})
class Ex31 {
  nav = [
    { key: 'users',    label: 'Users' },
    { key: 'posts',    label: 'Posts' },
    { key: 'settings', label: 'Settings' },
  ];
  active = signal('users');
  title = computed(() => this.nav.find(n => n.key === this.active())?.label ?? '');
}

// 32. Wizard: step1 → step2 → step3 → review (signal stepper)
@Component({
  selector: 'ex-32', standalone: true,
  template: `
    <p><strong>Multi-step wizard (nested route simulation):</strong></p>
    <div style="font-size:13px">
      <div style="display:flex;gap:4px;margin-bottom:8px">
        @for (s of steps; track s.num) {
          <div style="padding:4px 10px;border-radius:12px;font-size:11px"
            [style.background]="step() === s.num ? '#4299e1' : step() > s.num ? '#48bb78' : '#e2e8f0'"
            [style.color]="step() >= s.num ? '#fff' : '#4a5568'">
            {{ s.label }}
          </div>
        }
      </div>
      <div style="padding:8px;background:#f7fafc;border-radius:4px">
        <em>/wizard/step{{ step() }}</em>
        @if (step() === 1) { <p>Step 1: Personal Info</p> }
        @if (step() === 2) { <p>Step 2: Account Details</p> }
        @if (step() === 3) { <p>Step 3: Preferences</p> }
        @if (step() === 4) { <p>Review & Submit</p> }
      </div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button [disabled]="step() === 1" (click)="step.update(s => s - 1)">← Back</button>
        <button [disabled]="step() === 4" (click)="step.update(s => s + 1)">Next →</button>
      </div>
    </div>
  `
})
class Ex32 {
  steps = [
    { num: 1, label: 'Info' },
    { num: 2, label: 'Account' },
    { num: 3, label: 'Prefs' },
    { num: 4, label: 'Review' },
  ];
  step = signal(1);
}

// 33. Document viewer: file tree + content pane (signal selection)
@Component({
  selector: 'ex-33', standalone: true,
  template: `
    <p><strong>Document viewer with file tree navigation:</strong></p>
    <div style="display:flex;gap:0;border:1px solid #e2e8f0;font-size:13px">
      <div style="background:#f7fafc;min-width:130px;padding:8px;border-right:1px solid #e2e8f0">
        <strong>Files</strong>
        @for (folder of tree; track folder.name) {
          <div style="margin-top:6px">
            <div style="font-weight:bold">📁 {{ folder.name }}</div>
            @for (file of folder.files; track file) {
              <div style="padding-left:12px;cursor:pointer"
                [style.color]="selected() === file ? '#4299e1' : '#4a5568'"
                (click)="selected.set(file)">
                📄 {{ file }}
              </div>
            }
          </div>
        }
      </div>
      <div style="flex:1;padding:10px">
        @if (selected()) {
          <strong>{{ selected() }}</strong>
          <p>Content of document: <em>{{ selected() }}</em></p>
        } @else {
          <p style="color:#a0aec0">Select a file to view</p>
        }
      </div>
    </div>
  `
})
class Ex33 {
  tree = [
    { name: 'Guides', files: ['Getting Started', 'Installation', 'Configuration'] },
    { name: 'API', files: ['Router API', 'Routes Interface', 'Guards'] },
  ];
  selected = signal('');
}

// 34. Multi-tenant routing structure — code display
@Component({
  selector: 'ex-34', standalone: true,
  template: `
    <p><strong>Multi-tenant nested routing:</strong></p>
    <pre>
// URL pattern: /:tenant/dashboard/overview
{{ '{' }}
  path: ':tenant',
  component: TenantShellComponent,
  canActivate: [tenantGuard],
  resolve: {{ '{' }} tenant: tenantResolver {{ '}' }},
  children: [
    {{ '{' }} path: 'dashboard', component: DashboardComponent, children: [
      {{ '{' }} path: 'overview', component: OverviewComponent {{ '}' }},
      {{ '{' }} path: 'billing',  component: BillingComponent {{ '}' }}
    ]}
  ]
{{ '}' }}</pre>
    <p>The <code>:tenant</code> param is available to all nested children via <code>ActivatedRoute.parent.params</code> or <code>paramsInheritanceStrategy: 'always'</code>.</p>
  `
})
class Ex34 {}

// 35. CMS content type nesting — code display
@Component({
  selector: 'ex-35', standalone: true,
  template: `
    <p><strong>CMS content type routing hierarchy:</strong></p>
    <pre>
/cms
  /content
    /articles
      /new                  → ArticleEditorComponent
      /:id/edit             → ArticleEditorComponent
      /:id/preview          → ArticlePreviewComponent
    /pages
      /:slug/edit           → PageEditorComponent
    /media
      /upload               → MediaUploadComponent
      /library              → MediaLibraryComponent
  /taxonomies
    /categories             → CategoriesComponent
    /tags                   → TagsComponent</pre>
  `
})
class Ex35 {}

// 36. App shell + nested feature areas — code display
@Component({
  selector: 'ex-36', standalone: true,
  template: `
    <p><strong>App shell with nested feature modules:</strong></p>
    <pre>
// App shell route (eager)
{{ '{' }}
  path: '',
  component: AppShellComponent,
  children: [
    {{ '{' }} path: '',        component: HomeComponent, pathMatch: 'full' {{ '}' }},
    // Lazy-loaded feature areas (each has its own router-outlet)
    {{ '{' }} path: 'shop',    loadChildren: () => import('./shop/routes') {{ '}' }},
    {{ '{' }} path: 'account', loadChildren: () => import('./account/routes') {{ '}' }},
    {{ '{' }} path: 'admin',   loadChildren: () => import('./admin/routes'),
      canLoad: [adminGuard] {{ '}' }}
  ]
{{ '}' }}</pre>
    <p>Each lazy-loaded feature defines its own nested route tree internally.</p>
  `
})
class Ex36 {}

// 37. Secondary outlet for slide-over panel (signal toggle)
@Component({
  selector: 'ex-37', standalone: true,
  template: `
    <p><strong>Named outlet as slide-over panel (simulated):</strong></p>
    <div style="position:relative;border:1px solid #e2e8f0;padding:12px;font-size:13px;min-height:80px">
      <strong>Main Content</strong>
      <p>Primary outlet renders here.</p>
      <button (click)="panelOpen.update(v => !v)">
        {{ panelOpen() ? 'Close Panel' : 'Open Detail Panel' }}
      </button>
      @if (panelOpen()) {
        <div style="position:absolute;top:0;right:0;width:180px;height:100%;background:#ebf8ff;border-left:2px solid #90cdf4;padding:10px">
          <strong>Detail Panel</strong>
          <p>Rendered in: <code>&lt;router-outlet name="panel"&gt;</code></p>
          <p>URL: <code>(panel:detail/42)</code></p>
        </div>
      }
    </div>
    <pre style="font-size:11px;margin-top:4px">
// Route config:
{{ '{' }} path: 'detail/:id', component: DetailPanelComponent, outlet: 'panel' {{ '}' }}
// Navigate:
router.navigate([{{ '{' }} outlets: {{ '{' }} panel: ['detail', 42] {{ '}' }} {{ '}' }}])</pre>
  `
})
class Ex37 {
  panelOpen = signal(false);
}

// 38. Breadcrumb built from nested hierarchy (signal array)
@Component({
  selector: 'ex-38', standalone: true,
  template: `
    <p><strong>Breadcrumb derived from nested route hierarchy:</strong></p>
    <div style="font-size:13px;margin-bottom:8px">
      <span style="color:#718096">Current path: </span>
      <select (change)="setPath($event)">
        @for (option of paths; track option.label) {
          <option [value]="option.label">{{ option.label }}</option>
        }
      </select>
    </div>
    <nav style="display:flex;gap:4px;align-items:center;font-size:13px">
      @for (crumb of breadcrumbs(); track crumb; let last = $last) {
        @if (!last) {
          <span style="color:#4299e1;cursor:pointer">{{ crumb }}</span>
          <span style="color:#a0aec0">›</span>
        } @else {
          <span style="color:#2d3748;font-weight:bold">{{ crumb }}</span>
        }
      }
    </nav>
  `
})
class Ex38 {
  paths = [
    { label: 'Home', crumbs: ['Home'] },
    { label: 'Admin / Users', crumbs: ['Home', 'Admin', 'Users'] },
    { label: 'Admin / Users / Alice', crumbs: ['Home', 'Admin', 'Users', 'Alice'] },
    { label: 'Admin / Users / Alice / Settings', crumbs: ['Home', 'Admin', 'Users', 'Alice', 'Settings'] },
  ];
  breadcrumbs = signal(['Home']);
  setPath(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    const found = this.paths.find(p => p.label === val);
    if (found) this.breadcrumbs.set(found.crumbs);
  }
}

// ─── ADVANCED (39–50) ────────────────────────────────────────

// 39. componentless routes as pure layout — code display
@Component({
  selector: 'ex-39', standalone: true,
  template: `
    <p><strong>Componentless routes as layout/guard groups:</strong></p>
    <pre>
// No component — just groups children under a path prefix
// and applies shared guards/resolvers
{{ '{' }}
  path: 'secure',
  canActivate: [authGuard],
  canActivateChild: [authGuard],
  // NO component property
  children: [
    {{ '{' }} path: 'dashboard', component: DashboardComponent {{ '}' }},
    {{ '{' }} path: 'profile',   component: ProfileComponent {{ '}' }}
  ]
{{ '}' }}

// The parent outlet renders children directly — no wrapper component needed.
// Angular merges the empty parent outlet with the app-level outlet.</pre>
  `
})
class Ex39 {}

// 40. Named outlet activation/deactivation — code display
@Component({
  selector: 'ex-40', standalone: true,
  template: `
    <p><strong>Named outlet activation & deactivation:</strong></p>
    <pre>
// Activate secondary outlet:
router.navigate([{{ '{' }} outlets: {{ '{' }} sidebar: ['help'] {{ '}' }} {{ '}' }}]);
// URL: /dashboard(sidebar:help)

// Deactivate (close) secondary outlet:
router.navigate([{{ '{' }} outlets: {{ '{' }} sidebar: null {{ '}' }} {{ '}' }}]);
// URL: /dashboard

// Check if outlet has an active component:
const outlet = this.viewContainerRef; // injected
// Or use Router events to track outlet state</pre>
  `
})
class Ex40 {}

// 41. Multiple router-outlets strategy — code display
@Component({
  selector: 'ex-41', standalone: true,
  template: `
    <p><strong>Multiple named router-outlets strategy:</strong></p>
    <pre>
/* AppComponent template: */
&lt;router-outlet /&gt;                    &lt;!-- primary --&gt;
&lt;router-outlet name="rightPanel" /&gt;   &lt;!-- detail panel --&gt;
&lt;router-outlet name="modal" /&gt;        &lt;!-- modal overlay --&gt;

/* Routes: */
{{ '{' }} path: 'detail/:id',  component: DetailComponent, outlet: 'rightPanel' {{ '}' }},
{{ '{' }} path: 'confirm/:id', component: ConfirmComponent, outlet: 'modal' {{ '}' }}

/* URL with multiple active outlets: */
// /list(rightPanel:detail/5//modal:confirm/5)</pre>
  `
})
class Ex41 {}

// 42. RouteReuseStrategy concept — code display
@Component({
  selector: 'ex-42', standalone: true,
  template: `
    <p><strong>RouteReuseStrategy — persist component state across navigation:</strong></p>
    <pre>
@Injectable()
class CustomReuseStrategy implements RouteReuseStrategy {{ '{' }}
  private cache = new Map&lt;string, DetachedRouteHandle&gt;();

  shouldDetach(route: ActivatedRouteSnapshot): boolean {{ '{' }}
    return !!route.data['reuse'];  // opt-in via route data
  {{ '}' }}
  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle) {{ '{' }}
    this.cache.set(route.routeConfig!.path!, handle);
  {{ '}' }}
  shouldAttach(route: ActivatedRouteSnapshot): boolean {{ '{' }}
    return this.cache.has(route.routeConfig!.path!);
  {{ '}' }}
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {{ '{' }}
    return this.cache.get(route.routeConfig!.path!) ?? null;
  {{ '}' }}
  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot) {{ '{' }}
    return future.routeConfig === curr.routeConfig;
  {{ '}' }}
{{ '}' }}</pre>
  `
})
class Ex42 {}

// 43. Deep linking in nested routes — code display
@Component({
  selector: 'ex-43', standalone: true,
  template: `
    <p><strong>Deep linking support in nested routes:</strong></p>
    <pre>
// Deep link URL: /admin/users/42/activity?tab=comments#section-2

// Route config handles it automatically with proper nesting:
{{ '{' }} path: 'admin', component: AdminShell, children: [
  {{ '{' }} path: 'users', component: UsersList, children: [
    {{ '{' }} path: ':id', component: UserDetail,
      resolve: {{ '{' }} user: userResolver {{ '}' }},
      children: [
        {{ '{' }} path: 'activity', component: UserActivity {{ '}' }},
      ]
    {{ '}' }}
  ]}
]}

// Angular Router resolves the full path top-down,
// activating each component in order.
// fragment (#section-2) is accessible via ActivatedRoute.fragment</pre>
  `
})
class Ex43 {}

// 44. Nested routes scroll restoration — code display
@Component({
  selector: 'ex-44', standalone: true,
  template: `
    <p><strong>Scroll restoration in nested route context:</strong></p>
    <pre>
// Enable scroll restoration globally:
provideRouter(routes, withInMemoryScrolling({{
  '{' }}
  scrollPositionRestoration: 'enabled', // restore on back/forward
  anchorScrolling: 'enabled'            // support #fragment scrolling
{{ '}' }}))

// Per-route scroll offset:
{{ '{' }} path: 'detail', component: DetailComponent,
  data: {{ '{' }} scrollOffset: [0, 64] {{ '}' }} {{ '}' }} // [x, y] offset for fixed headers

// For nested components with own scrollable containers:
// Use ViewportScroller or handle scroll manually in component
// via Router events (NavigationEnd)</pre>
  `
})
class Ex44 {}

// 45. Route animation host in nested context — code display
@Component({
  selector: 'ex-45', standalone: true,
  template: `
    <p><strong>Route animations in nested router-outlet:</strong></p>
    <pre>
// Wrap nested router-outlet with animation host:
@Component({{ '{' }}
  template: \`
    &lt;div [@routeAnim]="getRouteState(outlet)"&gt;
      &lt;router-outlet #outlet="outlet" /&gt;
    &lt;/div&gt;
  \`,
  animations: [
    trigger('routeAnim', [
      transition(':enter', [style({{ '{' }} opacity: 0 {{ '}' }}), animate('200ms', style({{ '{' }} opacity: 1 {{ '}' }}))]),
      transition(':leave', [animate('200ms', style({{ '{' }} opacity: 0 {{ '}' }}))]),
    ])
  ]
{{ '}' }})
class NestedShellComponent {{ '{' }}
  getRouteState(outlet: RouterOutlet) {{ '{' }}
    return outlet.activatedRouteData?.['animation'] ?? '';
  {{ '}' }}
{{ '}' }}</pre>
  `
})
class Ex45 {}

// 46. inheritParamData: 'always' config — code display
@Component({
  selector: 'ex-46', standalone: true,
  template: `
    <p><strong>paramsInheritanceStrategy: 'always' — full param inheritance:</strong></p>
    <pre>
// Bootstrap config:
bootstrapApplication(AppComponent, {{ '{' }}
  providers: [
    provideRouter(
      routes,
      withRouterConfig({{ '{' }} paramsInheritanceStrategy: 'always' {{ '}' }})
    )
  ]
{{ '}' }});

// Effect: a deeply nested child at /items/:id/detail/comments
// can inject ActivatedRoute and read :id directly from route.params
// without traversing to parent. Same for queryParams and data.

// Without 'always' (default 'emptyOnly'):
// child only inherits if its own path is '' (empty)</pre>
  `
})
class Ex46 {}

// 47. CanDeactivate on parent component — code display
@Component({
  selector: 'ex-47', standalone: true,
  template: `
    <p><strong>CanDeactivate guard on a parent nested route:</strong></p>
    <pre>
// Functional guard:
export const unsavedChangesGuard: CanDeactivateFn&lt;DashboardComponent&gt; =
  (component) => {{ '{' }}
    if (component.hasUnsavedChanges()) {{ '{' }}
      return confirm('You have unsaved changes. Leave anyway?');
    {{ '}' }}
    return true;
  {{ '}' }};

// Route config:
{{ '{' }}
  path: 'dashboard',
  component: DashboardComponent,
  canDeactivate: [unsavedChangesGuard],
  children: [
    {{ '{' }} path: 'edit', component: EditComponent {{ '}' }}
  ]
{{ '}' }}

// Guard fires when navigating AWAY from dashboard or any child.</pre>
  `
})
class Ex47 {}

// 48. Selective preloading of nested routes — code display
@Component({
  selector: 'ex-48', standalone: true,
  template: `
    <p><strong>Selective preloading strategy for nested lazy routes:</strong></p>
    <pre>
// Custom preloading strategy:
@Injectable()
class SelectivePreloadStrategy implements PreloadingStrategy {{ '{' }}
  preload(route: Route, load: () => Observable&lt;any&gt;): Observable&lt;any&gt; {{ '{' }}
    return route.data?.['preload'] === true ? load() : EMPTY;
  {{ '}' }}
{{ '}' }}

// Route config:
{{ '{' }} path: 'shop', loadChildren: () => import('./shop/routes'),
  data: {{ '{' }} preload: true {{ '}' }} {{ '}' }},  // will preload
{{ '{' }} path: 'admin', loadChildren: () => import('./admin/routes'),
  data: {{ '{' }} preload: false {{ '}' }} {{ '}' }} // will NOT preload

// Register strategy:
provideRouter(routes, withPreloading(SelectivePreloadStrategy))</pre>
  `
})
class Ex48 {}

// 49. Secondary outlet URL encoding (;outlets:...) — code display
@Component({
  selector: 'ex-49', standalone: true,
  template: `
    <p><strong>Secondary outlet URL syntax:</strong></p>
    <pre>
// URL structure with named outlets:
// Primary + secondary active:
/list(sidebar:detail/42)
/list(sidebar:detail/42//modal:confirm)

// With query params:
/list(sidebar:detail/42)?sort=asc

// Programmatic navigation:
router.navigate([
  '/list',
  {{ '{' }} outlets: {{ '{' }} sidebar: ['detail', 42], modal: ['confirm'] {{ '}' }} {{ '}' }}
], {{ '{' }} queryParams: {{ '{' }} sort: 'asc' {{ '}' }} {{ '}' }});

// Parsing outlet state from URL:
// router.parseUrl(url).root.children['sidebar'].segments</pre>
  `
})
class Ex49 {}

// 50. Full enterprise nested routing architecture — code display
@Component({
  selector: 'ex-50', standalone: true,
  template: `
    <p><strong>Full enterprise nested routing architecture:</strong></p>
    <pre style="font-size:11px">
// app.routes.ts
export const APP_ROUTES: Routes = [
  // Public shell (no auth)
  {{ '{' }} path: '', component: PublicShell, children: [
    {{ '{' }} path: '', component: LandingPage, pathMatch: 'full' {{ '}' }},
    {{ '{' }} path: 'login',    component: LoginPage {{ '}' }},
    {{ '{' }} path: 'register', component: RegisterPage {{ '}' }},
  ]},

  // Authenticated shell (lazy)
  {{ '{' }} path: 'app', component: AppShell,
    canActivate: [authGuard],
    canActivateChild: [sessionGuard],
    children: [
      {{ '{' }} path: '', redirectTo: 'dashboard', pathMatch: 'full' {{ '}' }},
      {{ '{' }} path: 'dashboard', loadChildren: () => import('./dashboard/routes') {{ '}' }},
      {{ '{' }} path: 'shop',      loadChildren: () => import('./shop/routes'),
        data: {{ '{' }} preload: true {{ '}' }} {{ '}' }},
      {{ '{' }} path: 'account',   loadChildren: () => import('./account/routes') {{ '}' }},
      {{ '{' }} path: 'admin',     loadChildren: () => import('./admin/routes'),
        canActivate: [roleGuard('admin')] {{ '}' }},
    ]
  },

  // Named outlet (notifications panel)
  {{ '{' }} path: 'notifications', component: NotificationsPanel,
    outlet: 'panel' {{ '}' }},

  {{ '{' }} path: '**', component: NotFoundPage {{ '}' }}
];</pre>
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
      <h1>Examples 4.4 — Nested Routes</h1>
      <h4>1. children array config</h4><ex-01 /><hr />
      <h4>2. Nested router-outlet concept</h4><ex-02 /><hr />
      <h4>3. Default child path ''</h4><ex-03 /><hr />
      <h4>4. Redirect child route</h4><ex-04 /><hr />
      <h4>5. pathMatch: 'full' vs 'prefix'</h4><ex-05 /><hr />
      <h4>6. Componentless parent route</h4><ex-06 /><hr />
      <h4>7. Named outlet concept</h4><ex-07 /><hr />
      <h4>8. Relative RouterLink ./child</h4><ex-08 /><hr />
      <h4>9. Relative RouterLink ../sibling</h4><ex-09 /><hr />
      <h4>10. ActivatedRoute parent params</h4><ex-10 /><hr />
      <h4>11. Route data on child</h4><ex-11 /><hr />
      <h4>12. Children with canActivate</h4><ex-12 /><hr />
      <h4>13. Children with resolve</h4><ex-13 /><hr />
      <h4>14. Tab interface (signal tabs)</h4><ex-14 /><hr />
      <h4>15. Settings page sub-sections</h4><ex-15 /><hr />
      <h4>16. Dashboard nested sections</h4><ex-16 /><hr />
      <h4>17. Auth layout route pattern</h4><ex-17 /><hr />
      <h4>18. 3-level nesting structure</h4><ex-18 /><hr />
      <h4>19. Route data inheritance</h4><ex-19 /><hr />
      <h4>20. Param inheritance (inheritParamData)</h4><ex-20 /><hr />
      <h4>21. Children with own guards</h4><ex-21 /><hr />
      <h4>22. Children with own resolvers</h4><ex-22 /><hr />
      <h4>23. Children with different titles</h4><ex-23 /><hr />
      <h4>24. canActivateChild concept</h4><ex-24 /><hr />
      <h4>25. Empty path children setup</h4><ex-25 /><hr />
      <h4>26. Multi-level relative navigation</h4><ex-26 /><hr />
      <h4>27. Full dashboard: sidebar + content</h4><ex-27 /><hr />
      <h4>28. E-commerce: list → detail → reviews</h4><ex-28 /><hr />
      <h4>29. Blog: category → post list → post detail</h4><ex-29 /><hr />
      <h4>30. Profile tabs: activity/settings/friends</h4><ex-30 /><hr />
      <h4>31. Admin panel: users/posts/settings</h4><ex-31 /><hr />
      <h4>32. Wizard: step1 → step2 → step3 → review</h4><ex-32 /><hr />
      <h4>33. Document viewer: file tree + content pane</h4><ex-33 /><hr />
      <h4>34. Multi-tenant routing structure</h4><ex-34 /><hr />
      <h4>35. CMS content type nesting</h4><ex-35 /><hr />
      <h4>36. App shell + nested feature areas</h4><ex-36 /><hr />
      <h4>37. Secondary outlet for slide-over panel</h4><ex-37 /><hr />
      <h4>38. Breadcrumb from nested hierarchy</h4><ex-38 /><hr />
      <h4>39. Componentless routes as pure layout</h4><ex-39 /><hr />
      <h4>40. Named outlet activation/deactivation</h4><ex-40 /><hr />
      <h4>41. Multiple router-outlets strategy</h4><ex-41 /><hr />
      <h4>42. RouteReuseStrategy concept</h4><ex-42 /><hr />
      <h4>43. Deep linking in nested routes</h4><ex-43 /><hr />
      <h4>44. Nested routes scroll restoration</h4><ex-44 /><hr />
      <h4>45. Route animation host in nested context</h4><ex-45 /><hr />
      <h4>46. inheritParamData: 'always' config</h4><ex-46 /><hr />
      <h4>47. CanDeactivate on parent component</h4><ex-47 /><hr />
      <h4>48. Selective preloading of nested routes</h4><ex-48 /><hr />
      <h4>49. Secondary outlet URL encoding</h4><ex-49 /><hr />
      <h4>50. Full enterprise nested routing architecture</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
