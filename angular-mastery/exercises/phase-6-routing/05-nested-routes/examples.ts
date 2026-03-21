import { Component, signal, computed } from '@angular/core';

// ============================================================
// Examples 6.5 — Nested Routes (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. children array config — code display
@Component({
  selector: 'ex-01', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// children creates nested route hierarchy
const routes: Routes = [
  {{ '{' }}
    path: 'admin',
    component: AdminLayoutComponent,  // parent — renders &lt;router-outlet&gt;
    children: [                       // child routes
      {{ '{' }} path: 'users',  component: UsersComponent  {{ '}' }},
      {{ '{' }} path: 'posts',  component: PostsComponent  {{ '}' }},
      {{ '{' }} path: 'config', component: ConfigComponent {{ '}' }},
    ]
  {{ '}' }}
];

// URL /admin/users → AdminLayoutComponent renders UsersComponent
// URL /admin/posts → AdminLayoutComponent renders PostsComponent
    </pre>
  `
})
class Ex01 {}

// 2. Nested router-outlet — code display
@Component({
  selector: 'ex-02', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Parent layout component MUST contain &lt;router-outlet&gt;
@Component({{ '{' }}
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: \`
    &lt;nav&gt;
      &lt;a routerLink="users"&gt;Users&lt;/a&gt;
      &lt;a routerLink="posts"&gt;Posts&lt;/a&gt;
    &lt;/nav&gt;
    &lt;main&gt;
      &lt;router-outlet /&gt;  &lt;!-- child component renders here --&gt;
    &lt;/main&gt;
  \`
{{ '}' }})
export class AdminLayoutComponent {{ '{' }} {{ '}' }}
    </pre>
  `
})
class Ex02 {}

// 3. Child route with params — code display
@Component({
  selector: 'ex-03', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
const routes: Routes = [
  {{ '{' }}
    path: 'users',
    component: UsersLayoutComponent,
    children: [
      {{ '{' }} path: '',    component: UserListComponent  {{ '}' }},  // /users
      {{ '{' }} path: ':id', component: UserDetailComponent {{ '}' }}, // /users/42
      {{ '{' }} path: ':id/edit', component: UserEditComponent {{ '}' }}, // /users/42/edit
    ]
  {{ '}' }}
];

// In UserDetailComponent:
// readonly route = inject(ActivatedRoute);
// readonly userId = toSignal(this.route.params.pipe(map(p => p['id'])));
    </pre>
  `
})
class Ex03 {}

// 4. Default child path '' — code display
@Component({
  selector: 'ex-04', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// path: '' renders a default child when parent URL is hit
const routes: Routes = [
  {{ '{' }}
    path: 'dashboard',
    component: DashboardLayoutComponent,
    children: [
      {{ '{' }} path: '',        component: DashboardHomeComponent  {{ '}' }}, // /dashboard
      {{ '{' }} path: 'reports', component: ReportsComponent        {{ '}' }}, // /dashboard/reports
      {{ '{' }} path: 'users',   component: UsersComponent          {{ '}' }}, // /dashboard/users
    ]
  {{ '}' }}
];
// Navigating to /dashboard shows DashboardHomeComponent by default
    </pre>
  `
})
class Ex04 {}

// 5. Redirect child — code display
@Component({
  selector: 'ex-05', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Redirect within children array
const routes: Routes = [
  {{ '{' }}
    path: 'settings',
    component: SettingsLayoutComponent,
    children: [
      // Redirect /settings → /settings/profile
      {{ '{' }} path: '',         redirectTo: 'profile', pathMatch: 'full' {{ '}' }},
      {{ '{' }} path: 'profile',  component: ProfileSettingsComponent  {{ '}' }},
      {{ '{' }} path: 'security', component: SecuritySettingsComponent {{ '}' }},
      {{ '{' }} path: 'billing',  component: BillingSettingsComponent  {{ '}' }},
    ]
  {{ '}' }}
];
    </pre>
  `
})
class Ex05 {}

// 6. pathMatch: 'full' — code display
@Component({
  selector: 'ex-06', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// pathMatch: 'full' — the ENTIRE remaining URL must match
// pathMatch: 'prefix' (default) — URL must START with the path

const routes: Routes = [
  // Redirect only when URL is EXACTLY '' (root)
  {{ '{' }} path: '', redirectTo: '/home', pathMatch: 'full' {{ '}' }},

  // pathMatch: 'prefix' (default) — matches '' in every URL
  // (would be dangerous without 'full')
  {{ '{' }} path: 'home', component: HomeComponent {{ '}' }},
];

// In children:
children: [
  {{ '{' }} path: '', redirectTo: 'overview', pathMatch: 'full' {{ '}' }}, // ← must use 'full'
]
    </pre>
  `
})
class Ex06 {}

// 7. componentless layout route — code display
@Component({
  selector: 'ex-07', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Componentless route — groups routes without a layout component
// The router-outlet of the PARENT is used directly
const routes: Routes = [
  {{ '{' }}
    path: 'auth',
    // No component: — children use the parent's router-outlet
    canActivate: [guestGuard],  // still can have guards!
    children: [
      {{ '{' }} path: 'login',  component: LoginComponent  {{ '}' }},
      {{ '{' }} path: 'signup', component: SignupComponent {{ '}' }},
      {{ '{' }} path: 'reset',  component: ResetComponent  {{ '}' }},
    ]
  {{ '}' }}
];
// /auth/login → LoginComponent in app-root's &lt;router-outlet&gt;
    </pre>
  `
})
class Ex07 {}

// 8. Named outlet concept — code display
@Component({
  selector: 'ex-08', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Named outlets allow multiple router-outlets on the same page
// app.component.html:
// &lt;router-outlet /&gt;               &lt;!-- primary outlet --&gt;
// &lt;router-outlet name="sidebar" /&gt; &lt;!-- secondary outlet --&gt;

// Route config:
const routes: Routes = [
  {{ '{' }} path: 'help', outlet: 'sidebar', component: HelpComponent {{ '}' }},
];

// Navigation:
// router.navigate([{{ '{' }} outlets: {{ '{' }} sidebar: ['help'] {{ '}' }} {{ '}' }}]);
// Or via RouterLink:
// [routerLink]="[{{ '{' }} outlets: {{ '{' }} sidebar: ['help'] {{ '}' }} {{ '}' }}]"

// URL: /home(sidebar:help)
    </pre>
  `
})
class Ex08 {}

// 9. Primary vs secondary outlet — code display
@Component({
  selector: 'ex-09', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Primary outlet: default, unnamed &lt;router-outlet&gt;
// Secondary outlet: named, for auxiliary content

// Template:
// &lt;router-outlet /&gt;              &lt;!-- primary: main content --&gt;
// &lt;router-outlet name="chat" /&gt;  &lt;!-- secondary: chat panel --&gt;
// &lt;router-outlet name="modal" /&gt; &lt;!-- secondary: modal --&gt;

// Routes:
{{ '{' }} path: 'messages', outlet: 'chat',  component: ChatComponent  {{ '}' }},
{{ '{' }} path: 'preview',  outlet: 'modal', component: PreviewComponent {{ '}' }},

// URL when both active: /dashboard(chat:messages//modal:preview)
// Close secondary: router.navigate([{{ '{' }} outlets: {{ '{' }} chat: null {{ '}' }} {{ '}' }}])
    </pre>
  `
})
class Ex09 {}

// 10. Relative RouterLink ./child simulation — signal nav
@Component({
  selector: 'ex-10', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #2196f3;border-radius:6px">
      <p style="margin:0;font-weight:bold">Relative RouterLink Navigation</p>
      <p style="font-size:13px;margin-top:6px">Current path: <code>{{ currentPath() }}</code></p>
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
        <button (click)="navigate('users')" style="padding:5px 10px;background:#2196f3;color:#fff;border:none;border-radius:4px;cursor:pointer">users</button>
        <button (click)="navigate('users/42')" style="padding:5px 10px;background:#2196f3;color:#fff;border:none;border-radius:4px;cursor:pointer">users/42</button>
        <button (click)="navigate('users/42/edit')" style="padding:5px 10px;background:#1565c0;color:#fff;border:none;border-radius:4px;cursor:pointer">users/42/edit</button>
      </div>
      @if (nav()) { <p style="margin-top:8px;font-size:13px;color:#555">routerLink="./{{ nav() }}" → <code>/admin/{{ nav() }}</code></p> }
    </div>
  `
})
class Ex10 {
  currentPath = signal('/admin');
  nav = signal('');
  navigate(path: string) { this.nav.set(path); this.currentPath.set('/admin/' + path); }
}

// 11. Relative RouterLink ../sibling simulation — signal nav
@Component({
  selector: 'ex-11', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #ff9800;border-radius:6px">
      <p style="margin:0;font-weight:bold">../sibling Navigation</p>
      <p style="font-size:13px;margin-top:6px">From: <code>{{ from() }}</code></p>
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
        <button (click)="go('profile')"  style="padding:5px 10px;background:#ff9800;color:#fff;border:none;border-radius:4px;cursor:pointer">../profile</button>
        <button (click)="go('security')" style="padding:5px 10px;background:#ff9800;color:#fff;border:none;border-radius:4px;cursor:pointer">../security</button>
        <button (click)="go('billing')"  style="padding:5px 10px;background:#e65100;color:#fff;border:none;border-radius:4px;cursor:pointer">../billing</button>
      </div>
      @if (to()) { <p style="margin-top:8px;font-size:13px;color:#555">Navigated to: <code>{{ to() }}</code></p> }
    </div>
  `
})
class Ex11 {
  from = signal('/settings/profile');
  to = signal('');
  go(sibling: string) {
    this.from.set('/settings/' + sibling);
    this.to.set('/settings/' + sibling);
    setTimeout(() => this.to.set(''), 2000);
  }
}

// 12. ActivatedRoute parent — code display
@Component({
  selector: 'ex-12', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Accessing parent route data from a child component
@Component({{ '{' }} standalone: true {{ '}' }})
export class CommentComponent {{ '{' }}
  private route = inject(ActivatedRoute);

  // Read param from PARENT route (post/:id → child comments)
  readonly postId = toSignal(
    this.route.parent!.params.pipe(map(p => p['id']))
  );

  // Access parent's resolved data
  readonly post = toSignal(
    this.route.parent!.data.pipe(map(d => d['post']))
  );
{{ '}' }}
// Route: {{ '{' }} path: 'post/:id', children: [{{ '{' }} path: 'comments', component: CommentComponent {{ '}' }}] {{ '}' }}
    </pre>
  `
})
class Ex12 {}

// 13. Route data on child — code display
@Component({
  selector: 'ex-13', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Each child route can have its own data property
const routes: Routes = [
  {{ '{' }}
    path: 'settings',
    component: SettingsLayoutComponent,
    data: {{ '{' }} breadcrumb: 'Settings' {{ '}' }},        // parent data
    children: [
      {{ '{' }} path: 'profile',  component: ProfileComponent,
        data: {{ '{' }} breadcrumb: 'Profile', icon: 'person' {{ '}' }} {{ '}' }},
      {{ '{' }} path: 'security', component: SecurityComponent,
        data: {{ '{' }} breadcrumb: 'Security', icon: 'lock'   {{ '}' }} {{ '}' }},
    ]
  {{ '}' }}
];

// In child component:
// readonly data = inject(ActivatedRoute).snapshot.data;
// // → {{ '{' }} breadcrumb: 'Profile', icon: 'person' {{ '}' }}
    </pre>
  `
})
class Ex13 {}

// ─── INTERMEDIATE (14–26) ───────────────────────────────────

// 14. 3-level nesting structure — code display
@Component({
  selector: 'ex-14', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// 3 levels deep: app → admin → users → detail
const routes: Routes = [
  {{ '{' }}
    path: 'admin',
    component: AdminShellComponent,           // level 1
    children: [
      {{ '{' }}
        path: 'users',
        component: UsersShellComponent,       // level 2
        children: [
          {{ '{' }} path: '',    component: UserListComponent  {{ '}' }},
          {{ '{' }}
            path: ':id',
            component: UserDetailShellComponent,  // level 3
            children: [
              {{ '{' }} path: '',         component: UserOverviewComponent {{ '}' }},
              {{ '{' }} path: 'activity', component: UserActivityComponent {{ '}' }},
              {{ '{' }} path: 'settings', component: UserSettingsComponent {{ '}' }},
            ]
          {{ '}' }},
        ]
      {{ '}' }},
    ]
  {{ '}' }}
];
// URL: /admin/users/42/activity
    </pre>
  `
})
class Ex14 {}

// 15. Multi-level relative navigation — code display
@Component({
  selector: 'ex-15', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Relative navigation at different nesting levels
@Component({{ '{' }} standalone: true {{ '}' }})
export class UserOverviewComponent {{ '{' }}
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  // From /admin/users/42 (level 3):
  goToActivity()  {{ '{' }} this.router.navigate(['activity'],   {{ '{' }} relativeTo: this.route {{ '}' }}); {{ '}' }}
  // → /admin/users/42/activity

  goToSiblingUser() {{ '{' }} this.router.navigate(['../99'],    {{ '{' }} relativeTo: this.route {{ '}' }}); {{ '}' }}
  // → /admin/users/99

  goToUsersRoot()   {{ '{' }} this.router.navigate(['../../'],   {{ '{' }} relativeTo: this.route {{ '}' }}); {{ '}' }}
  // → /admin/users

  goToAdminRoot()   {{ '{' }} this.router.navigate(['../../../'],{{ '{' }} relativeTo: this.route {{ '}' }}); {{ '}' }}
  // → /admin
{{ '}' }}
    </pre>
  `
})
class Ex15 {}

// 16. Route data inheritance — code display
@Component({
  selector: 'ex-16', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// paramsInheritanceStrategy: 'always' — children inherit parent data
withRouterConfig({{ '{' }} paramsInheritanceStrategy: 'always' {{ '}' }})

// With inheritance: child can read parent's data:
const routes: Routes = [
  {{ '{' }}
    path: 'shop',
    data: {{ '{' }} theme: 'dark', currency: 'USD' {{ '}' }},
    children: [
      {{ '{' }} path: 'products', component: ProductsComponent {{ '}' }},
      // ProductsComponent.route.snapshot.data includes:
      // {{ '{' }} theme: 'dark', currency: 'USD' {{ '}' }}  ← inherited from parent
    ]
  {{ '}' }}
];

// Without inheritance (default): child only sees its own data
    </pre>
  `
})
class Ex16 {}

// 17. Param inheritance — code display
@Component({
  selector: 'ex-17', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Child routes can read parent params when inheritance is enabled
withRouterConfig({{ '{' }} paramsInheritanceStrategy: 'always' {{ '}' }})

const routes: Routes = [
  {{ '{' }}
    path: 'user/:userId',
    component: UserShellComponent,
    children: [
      {{ '{' }}
        path: 'post/:postId',
        component: UserPostComponent
        // With 'always': has access to BOTH :userId AND :postId
        // Without: only has :postId
      {{ '}' }}
    ]
  {{ '}' }}
];

// UserPostComponent can do:
// route.snapshot.params['userId']  // works with 'always'
// route.snapshot.params['postId']  // always works
    </pre>
  `
})
class Ex17 {}

// 18. Tab interface (signal simulation) — active tab signal
@Component({
  selector: 'ex-18', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #2196f3;border-radius:6px">
      <p style="margin:0;font-weight:bold">Tab Navigation (signal simulation)</p>
      <div style="display:flex;gap:0;margin-top:10px;border-bottom:2px solid #e0e0e0">
        @for (tab of tabs; track tab) {
          <button
            (click)="active.set(tab)"
            [style.border-bottom]="active() === tab ? '2px solid #2196f3' : '2px solid transparent'"
            [style.color]="active() === tab ? '#2196f3' : '#555'"
            style="padding:8px 16px;background:none;border:none;border-top:none;border-left:none;border-right:none;cursor:pointer;font-weight:500;margin-bottom:-2px">
            {{ tab }}
          </button>
        }
      </div>
      <div style="padding:12px;background:#f5f5f5;border-radius:0 0 4px 4px;min-height:60px">
        @if (active() === 'Overview') { <p style="margin:0">Overview content — /profile/overview</p> }
        @if (active() === 'Activity') { <p style="margin:0">Activity feed — /profile/activity</p> }
        @if (active() === 'Settings') { <p style="margin:0">Settings form — /profile/settings</p> }
        @if (active() === 'Friends')  { <p style="margin:0">Friends list — /profile/friends</p> }
      </div>
    </div>
  `
})
class Ex18 {
  tabs = ['Overview', 'Activity', 'Settings', 'Friends'];
  active = signal('Overview');
}

// 19. Settings page sub-routes (signal simulation)
@Component({
  selector: 'ex-19', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #9c27b0;border-radius:6px">
      <p style="margin:0;font-weight:bold">Settings Sub-Routes Simulation</p>
      <div style="display:flex;gap:8px;margin-top:10px">
        <div style="width:140px;flex-shrink:0">
          @for (item of items; track item.path) {
            <button
              (click)="current.set(item.path)"
              [style.background]="current() === item.path ? '#9c27b0' : '#f5f5f5'"
              [style.color]="current() === item.path ? '#fff' : '#333'"
              style="display:block;width:100%;text-align:left;padding:8px 12px;border:none;border-radius:4px;cursor:pointer;margin-bottom:4px">
              {{ item.label }}
            </button>
          }
        </div>
        <div style="flex:1;padding:10px;background:#f5f5f5;border-radius:4px">
          <p style="margin:0;font-weight:bold">/settings/{{ current() }}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#555">{{ content() }}</p>
        </div>
      </div>
    </div>
  `
})
class Ex19 {
  items = [
    { path: 'profile', label: 'Profile' },
    { path: 'security', label: 'Security' },
    { path: 'billing', label: 'Billing' },
    { path: 'notifications', label: 'Notifications' },
  ];
  current = signal('profile');
  content = computed(() => {
    const map: Record<string, string> = {
      profile: 'Edit your name, bio, avatar',
      security: 'Password, 2FA, sessions',
      billing: 'Subscription, invoices, payment methods',
      notifications: 'Email, push, SMS preferences',
    };
    return map[this.current()] ?? '';
  });
}

// 20. Dashboard nested sections — signal nav simulation
@Component({
  selector: 'ex-20', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #ff5722;border-radius:6px">
      <p style="margin:0;font-weight:bold">Dashboard Nested Sections</p>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
        @for (s of sections; track s) {
          <button
            (click)="section.set(s)"
            [style.background]="section() === s ? '#ff5722' : '#eee'"
            [style.color]="section() === s ? '#fff' : '#333'"
            style="padding:6px 14px;border:none;border-radius:4px;cursor:pointer">
            {{ s }}
          </button>
        }
      </div>
      <div style="margin-top:10px;padding:10px;background:#fff3e0;border-radius:4px">
        <p style="margin:0;font-size:13px">Route: <code>/dashboard/{{ section().toLowerCase() }}</code></p>
        <p style="margin:4px 0 0;font-weight:bold">{{ section() }} Section</p>
      </div>
    </div>
  `
})
class Ex20 {
  sections = ['Overview', 'Analytics', 'Reports', 'Users', 'Settings'];
  section = signal('Overview');
}

// 21. Auth layout route pattern — code display
@Component({
  selector: 'ex-21', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Auth layout wraps login/signup in a centered card layout
const routes: Routes = [
  {{ '{' }}
    path: 'auth',
    component: AuthLayoutComponent,   // centered card, brand logo
    canActivate: [guestGuard],        // redirect if already authed
    children: [
      {{ '{' }} path: '',       redirectTo: 'login', pathMatch: 'full' {{ '}' }},
      {{ '{' }} path: 'login',  component: LoginComponent  {{ '}' }},
      {{ '{' }} path: 'signup', component: SignupComponent {{ '}' }},
      {{ '{' }} path: 'forgot', component: ForgotComponent {{ '}' }},
      {{ '{' }} path: 'reset',  component: ResetComponent  {{ '}' }},
    ]
  {{ '}' }}
];

// AuthLayoutComponent:
// template: `
//   &lt;div class="auth-shell"&gt;
//     &lt;div class="auth-card"&gt;
//       &lt;router-outlet /&gt;
//     &lt;/div&gt;
//   &lt;/div&gt;
// `
    </pre>
  `
})
class Ex21 {}

// 22. Children with individual guards — code display
@Component({
  selector: 'ex-22', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Each child can have its own guard(s)
const routes: Routes = [
  {{ '{' }}
    path: 'admin',
    canActivate: [authGuard],         // all children require auth
    component: AdminLayoutComponent,
    children: [
      {{ '{' }} path: 'overview',  component: OverviewComponent  {{ '}' }},   // no extra guard
      {{ '{' }} path: 'users',     component: UsersComponent,
        canActivate: [managerGuard]                                        {{ '}' }}, // manager+
      {{ '{' }} path: 'billing',   component: BillingComponent,
        canActivate: [adminGuard]                                          {{ '}' }}, // admin only
      {{ '{' }} path: 'danger',    component: DangerZoneComponent,
        canActivate: [superAdminGuard, confirmGuard]                       {{ '}' }}, // super + confirm
    ]
  {{ '}' }}
];
    </pre>
  `
})
class Ex22 {}

// 23. Children with individual resolvers — code display
@Component({
  selector: 'ex-23', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Each child can pre-fetch its own specific data
const routes: Routes = [
  {{ '{' }}
    path: 'user/:id',
    component: UserShellComponent,
    resolve: {{ '{' }} user: userResolver {{ '}' }},   // shared by all children
    children: [
      {{ '{' }} path: 'overview',
        resolve: {{ '{' }} stats: userStatsResolver {{ '}' }},        // child-specific
        component: UserOverviewComponent {{ '}' }},
      {{ '{' }} path: 'posts',
        resolve: {{ '{' }} posts: userPostsResolver {{ '}' }},        // child-specific
        component: UserPostsComponent {{ '}' }},
      {{ '{' }} path: 'followers',
        resolve: {{ '{' }} followers: userFollowersResolver {{ '}' }}, // child-specific
        component: UserFollowersComponent {{ '}' }},
    ]
  {{ '}' }}
];
    </pre>
  `
})
class Ex23 {}

// 24. Children with different titles — code display
@Component({
  selector: 'ex-24', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Each child sets a different browser tab title
const routes: Routes = [
  {{ '{' }}
    path: 'settings',
    component: SettingsLayoutComponent,
    title: 'Settings',                 // default tab title
    children: [
      {{ '{' }} path: 'profile',  title: 'Profile Settings',       component: ProfileComponent  {{ '}' }},
      {{ '{' }} path: 'security', title: 'Security Settings',      component: SecurityComponent {{ '}' }},
      {{ '{' }} path: 'billing',  title: 'Billing & Subscription', component: BillingComponent  {{ '}' }},
      {{ '{' }} path: 'notif',    title: 'Notification Prefs',     component: NotifComponent    {{ '}' }},
    ]
  {{ '}' }}
];
// Tab title changes on each child navigation automatically
    </pre>
  `
})
class Ex24 {}

// 25. canActivateChild — code display
@Component({
  selector: 'ex-25', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// canActivateChild runs for EVERY child navigation
// (not just when the parent URL changes)
import {{ '{' }} CanActivateChildFn {{ '}' }} from '@angular/router';

export const sessionGuard: CanActivateChildFn =
  (childRoute, state) => {{ '{' }}
    const session = inject(SessionService);
    if (session.isExpired()) {{ '{' }}
      inject(AuthService).logout();
      return inject(Router).createUrlTree(['/login']);
    {{ '}' }}
    session.refresh(); // extend session on each navigation
    return true;
  {{ '}' }};

const routes: Routes = [
  {{ '{' }}
    path: 'app',
    canActivateChild: [sessionGuard], // runs on every child nav
    children: [...]
  {{ '}' }}
];
    </pre>
  `
})
class Ex25 {}

// 26. Empty path full children setup — code display
@Component({
  selector: 'ex-26', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Common pattern: componentless '' route groups authenticated routes
const routes: Routes = [
  // Public routes
  {{ '{' }} path: 'login',  component: LoginComponent  {{ '}' }},
  {{ '{' }} path: 'signup', component: SignupComponent {{ '}' }},

  // Authenticated app shell (empty path — no URL segment added)
  {{ '{' }}
    path: '',
    component: AppShellComponent,    // provides main layout + nav
    canActivate: [authGuard],
    children: [
      {{ '{' }} path: '',          redirectTo: 'dashboard', pathMatch: 'full' {{ '}' }},
      {{ '{' }} path: 'dashboard', component: DashboardComponent {{ '}' }},
      {{ '{' }} path: 'profile',   component: ProfileComponent   {{ '}' }},
      {{ '{' }} path: 'settings',  loadChildren: () => import('./settings/routes') {{ '}' }},
    ]
  {{ '}' }},

  {{ '{' }} path: '**', component: NotFoundComponent {{ '}' }},
];
    </pre>
  `
})
class Ex26 {}

// ─── NESTED (27–38) ─────────────────────────────────────────

// 27. Full dashboard: sidebar + nested content — signal nav
@Component({
  selector: 'ex-27', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #3f51b5;border-radius:6px">
      <p style="margin:0;font-weight:bold">Dashboard with Sidebar (signal nav)</p>
      <div style="display:flex;gap:0;margin-top:10px;height:200px">
        <div style="width:120px;background:#3f51b5;border-radius:4px 0 0 4px;padding:8px">
          @for (item of navItems; track item.path) {
            <button
              (click)="active.set(item.path)"
              [style.background]="active() === item.path ? 'rgba(255,255,255,0.2)' : 'transparent'"
              style="display:block;width:100%;text-align:left;padding:8px 10px;border:none;border-radius:4px;color:#fff;cursor:pointer;margin-bottom:4px;font-size:13px">
              {{ item.label }}
            </button>
          }
        </div>
        <div style="flex:1;padding:12px;background:#e8eaf6;border-radius:0 4px 4px 0">
          <p style="margin:0;font-weight:bold;color:#3f51b5">{{ activePage().label }}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#555">Route: /dashboard/{{ active() }}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#777">{{ activePage().desc }}</p>
        </div>
      </div>
    </div>
  `
})
class Ex27 {
  navItems = [
    { path: 'overview', label: 'Overview', desc: 'Summary cards and KPIs' },
    { path: 'analytics', label: 'Analytics', desc: 'Charts and data visualizations' },
    { path: 'reports', label: 'Reports', desc: 'Downloadable report files' },
    { path: 'settings', label: 'Settings', desc: 'Dashboard configuration' },
  ];
  active = signal('overview');
  activePage = computed(() => this.navItems.find(i => i.path === this.active()) ?? this.navItems[0]);
}

// 28. E-commerce: catalog → product → reviews — signal nav
@Component({
  selector: 'ex-28', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #e91e63;border-radius:6px">
      <p style="margin:0;font-weight:bold">E-commerce Nested Navigation</p>
      <div style="margin-top:10px;font-size:13px;color:#555">
        <span style="cursor:pointer;color:#e91e63" (click)="level.set('catalog')">Catalog</span>
        @if (level() !== 'catalog') {
          <span> / <span style="cursor:pointer;color:#e91e63" (click)="level.set('product')">Product #42</span></span>
        }
        @if (level() === 'reviews') {
          <span> / <span style="color:#333">Reviews</span></span>
        }
      </div>
      <div style="margin-top:8px;padding:10px;background:#fce4ec;border-radius:4px">
        @if (level() === 'catalog') {
          <div>
            <p style="margin:0;font-weight:bold">/shop/catalog</p>
            <button (click)="level.set('product')" style="margin-top:8px;padding:5px 12px;background:#e91e63;color:#fff;border:none;border-radius:4px;cursor:pointer">View Product #42</button>
          </div>
        }
        @if (level() === 'product') {
          <div>
            <p style="margin:0;font-weight:bold">/shop/catalog/42</p>
            <button (click)="level.set('reviews')" style="margin-top:8px;padding:5px 12px;background:#e91e63;color:#fff;border:none;border-radius:4px;cursor:pointer">Read Reviews</button>
          </div>
        }
        @if (level() === 'reviews') {
          <div>
            <p style="margin:0;font-weight:bold">/shop/catalog/42/reviews</p>
            <p style="margin:4px 0 0;font-size:12px">⭐⭐⭐⭐⭐ Great product! — 248 reviews</p>
          </div>
        }
      </div>
    </div>
  `
})
class Ex28 {
  level = signal<'catalog' | 'product' | 'reviews'>('catalog');
}

// 29. Blog: category → post → comments — signal nav
@Component({
  selector: 'ex-29', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #009688;border-radius:6px">
      <p style="margin:0;font-weight:bold">Blog Nested Navigation</p>
      <div style="margin-top:10px">
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button (click)="go('category')" [style.background]="page() === 'category' ? '#009688' : '#eee'" [style.color]="page() === 'category' ? '#fff' : '#333'" style="padding:5px 12px;border:none;border-radius:4px;cursor:pointer">/blog</button>
          <button (click)="go('post')" [style.background]="page() === 'post' ? '#009688' : '#eee'" [style.color]="page() === 'post' ? '#fff' : '#333'" style="padding:5px 12px;border:none;border-radius:4px;cursor:pointer">/blog/angular-signals</button>
          <button (click)="go('comments')" [style.background]="page() === 'comments' ? '#009688' : '#eee'" [style.color]="page() === 'comments' ? '#fff' : '#333'" style="padding:5px 12px;border:none;border-radius:4px;cursor:pointer">/blog/angular-signals/comments</button>
        </div>
        <div style="margin-top:10px;padding:10px;background:#e0f2f1;border-radius:4px;font-size:13px">
          @if (page() === 'category') { <p style="margin:0">Blog post list — category view</p> }
          @if (page() === 'post') { <p style="margin:0">Post: "Angular Signals Deep Dive"<br>5 min read · 3 tags</p> }
          @if (page() === 'comments') { <p style="margin:0">💬 24 comments on this post</p> }
        </div>
      </div>
    </div>
  `
})
class Ex29 {
  page = signal('category');
  go(p: string) { this.page.set(p); }
}

// 30. Profile: activity/settings/friends tabs — signal tabs
@Component({
  selector: 'ex-30', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #ff9800;border-radius:6px">
      <p style="margin:0;font-weight:bold">Profile Tabs (Nested Routes)</p>
      <div style="display:flex;align-items:center;gap:12px;margin-top:10px">
        <div style="width:48px;height:48px;background:#ff9800;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:18px">A</div>
        <div>
          <p style="margin:0;font-weight:bold">Alice Johnson</p>
          <p style="margin:0;font-size:12px;color:#555">/profile/alice</p>
        </div>
      </div>
      <div style="display:flex;gap:0;margin-top:12px;border-bottom:2px solid #ffe0b2">
        @for (tab of tabs; track tab) {
          <button
            (click)="active.set(tab)"
            [style.color]="active() === tab ? '#ff9800' : '#777'"
            [style.border-bottom]="active() === tab ? '2px solid #ff9800' : '2px solid transparent'"
            style="padding:6px 14px;background:none;border:none;border-top:none;border-left:none;border-right:none;cursor:pointer;margin-bottom:-2px">
            {{ tab }}
          </button>
        }
      </div>
      <div style="padding:10px;background:#fff8e1;min-height:50px;font-size:13px">
        /profile/alice/<strong>{{ active().toLowerCase() }}</strong>
      </div>
    </div>
  `
})
class Ex30 {
  tabs = ['Activity', 'Posts', 'Settings', 'Friends'];
  active = signal('Activity');
}

// 31. Admin: users/posts/settings — signal nav
@Component({
  selector: 'ex-31', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #607d8b;border-radius:6px">
      <p style="margin:0;font-weight:bold">Admin Panel Navigation</p>
      <div style="display:flex;gap:8px;margin-top:10px">
        <div style="width:130px">
          @for (item of menu; track item.path) {
            <button
              (click)="active.set(item.path)"
              [style.background]="active() === item.path ? '#607d8b' : '#f5f5f5'"
              [style.color]="active() === item.path ? '#fff' : '#333'"
              style="display:block;width:100%;text-align:left;padding:7px 12px;border:none;border-radius:4px;cursor:pointer;margin-bottom:4px;font-size:13px">
              {{ item.icon }} {{ item.label }}
            </button>
          }
        </div>
        <div style="flex:1;padding:10px;background:#eceff1;border-radius:4px;font-size:13px">
          <p style="margin:0;font-weight:bold">/admin/{{ active() }}</p>
          <p style="margin:4px 0 0;color:#555">{{ desc() }}</p>
        </div>
      </div>
    </div>
  `
})
class Ex31 {
  menu = [
    { path: 'users', label: 'Users', icon: '👥' },
    { path: 'posts', label: 'Posts', icon: '📝' },
    { path: 'media', label: 'Media', icon: '🖼' },
    { path: 'settings', label: 'Settings', icon: '⚙️' },
  ];
  active = signal('users');
  desc = computed(() => {
    const m: Record<string, string> = {
      users: 'Manage user accounts, roles, and permissions',
      posts: 'Review, publish, and moderate blog posts',
      media: 'Upload and organize media files',
      settings: 'Application configuration and preferences',
    };
    return m[this.active()] ?? '';
  });
}

// 32. Wizard: step1→step2→step3→review — signal stepper
@Component({
  selector: 'ex-32', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #673ab7;border-radius:6px">
      <p style="margin:0;font-weight:bold">Wizard Stepper (Nested Routes)</p>
      <div style="display:flex;align-items:center;margin-top:12px;gap:0">
        @for (step of steps; track step.n; let i = $index) {
          <div style="display:flex;align-items:center;flex:1">
            <div
              [style.background]="currentStep() >= step.n ? '#673ab7' : '#e0e0e0'"
              [style.color]="currentStep() >= step.n ? '#fff' : '#999'"
              style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;flex-shrink:0">
              {{ step.n }}
            </div>
            @if (i < steps.length - 1) {
              <div [style.background]="currentStep() > step.n ? '#673ab7' : '#e0e0e0'" style="flex:1;height:2px"></div>
            }
          </div>
        }
      </div>
      <div style="margin-top:10px;padding:10px;background:#ede7f6;border-radius:4px;font-size:13px">
        <p style="margin:0;font-weight:bold">/checkout/{{ steps[currentStep()-1].path }}</p>
        <p style="margin:4px 0 0;color:#555">{{ steps[currentStep()-1].label }}</p>
      </div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button (click)="prev()" [disabled]="currentStep() === 1" style="padding:6px 14px;background:#9e9e9e;color:#fff;border:none;border-radius:4px;cursor:pointer;opacity:0.9">Back</button>
        <button (click)="next()" [disabled]="currentStep() === steps.length" style="padding:6px 14px;background:#673ab7;color:#fff;border:none;border-radius:4px;cursor:pointer">Next</button>
      </div>
    </div>
  `
})
class Ex32 {
  steps = [
    { n: 1, path: 'cart',    label: 'Review cart items' },
    { n: 2, path: 'address', label: 'Enter shipping address' },
    { n: 3, path: 'payment', label: 'Payment details' },
    { n: 4, path: 'review',  label: 'Review and confirm order' },
  ];
  currentStep = signal(1);
  next() { if (this.currentStep() < this.steps.length) this.currentStep.update(s => s + 1); }
  prev() { if (this.currentStep() > 1) this.currentStep.update(s => s - 1); }
}

// 33. Document viewer: tree + content — signal selection
@Component({
  selector: 'ex-33', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #00bcd4;border-radius:6px">
      <p style="margin:0;font-weight:bold">Document Tree Navigation</p>
      <div style="display:flex;gap:0;margin-top:10px;height:180px">
        <div style="width:160px;background:#e0f7fa;border-radius:4px 0 0 4px;padding:8px;overflow:auto">
          @for (doc of docs; track doc.id) {
            <button
              (click)="selected.set(doc)"
              [style.background]="selected().id === doc.id ? '#00bcd4' : 'transparent'"
              [style.color]="selected().id === doc.id ? '#fff' : '#333'"
              [style.padding-left]="(doc.level * 12) + 'px'"
              style="display:block;width:100%;text-align:left;padding-top:5px;padding-bottom:5px;padding-right:8px;border:none;border-radius:3px;cursor:pointer;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              {{ doc.icon }} {{ doc.name }}
            </button>
          }
        </div>
        <div style="flex:1;padding:12px;background:#fff;border:1px solid #e0e0e0;border-radius:0 4px 4px 0;overflow:auto">
          <p style="margin:0;font-size:11px;color:#888">/docs/{{ selected().path }}</p>
          <p style="margin:4px 0 0;font-weight:bold;font-size:14px">{{ selected().name }}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#555">{{ selected().desc }}</p>
        </div>
      </div>
    </div>
  `
})
class Ex33 {
  docs = [
    { id: 1, level: 0, icon: '📁', name: 'Getting Started', path: 'getting-started', desc: 'Introduction and setup guide' },
    { id: 2, level: 1, icon: '📄', name: 'Installation', path: 'getting-started/install', desc: 'npm install instructions' },
    { id: 3, level: 1, icon: '📄', name: 'Quick Start', path: 'getting-started/quickstart', desc: 'Your first component' },
    { id: 4, level: 0, icon: '📁', name: 'Components', path: 'components', desc: 'Component API reference' },
    { id: 5, level: 1, icon: '📄', name: 'Inputs', path: 'components/inputs', desc: '@Input() decorator' },
    { id: 6, level: 1, icon: '📄', name: 'Outputs', path: 'components/outputs', desc: '@Output() and EventEmitter' },
  ];
  selected = signal(this.docs[0]);
}

// 34. Multi-tenant routing structure — code display
@Component({
  selector: 'ex-34', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Multi-tenant: /tenant/:tenantId/...
const routes: Routes = [
  {{ '{' }}
    path: 'tenant/:tenantId',
    component: TenantShellComponent,
    canActivate: [tenantGuard],           // verify tenant exists
    resolve: {{ '{' }} tenant: tenantResolver {{ '}' }},
    children: [
      {{ '{' }} path: '',          redirectTo: 'dashboard', pathMatch: 'full' {{ '}' }},
      {{ '{' }} path: 'dashboard', component: TenantDashboardComponent {{ '}' }},
      {{ '{' }} path: 'users',     component: TenantUsersComponent     {{ '}' }},
      {{ '{' }}
        path: 'settings',
        canActivate: [tenantAdminGuard],
        component: TenantSettingsComponent
      {{ '}' }},
    ]
  {{ '}' }}
];

// TenantShellComponent reads tenant from resolved data:
// readonly tenant = toSignal(route.data.pipe(map(d => d['tenant'])));
// Used for: branding, permissions, feature flags per tenant
    </pre>
  `
})
class Ex34 {}

// 35. CMS nested content types — code display
@Component({
  selector: 'ex-35', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// CMS with nested content types
const routes: Routes = [
  {{ '{' }}
    path: 'cms',
    component: CmsShellComponent,
    children: [
      {{ '{' }} path: '',           redirectTo: 'pages',  pathMatch: 'full' {{ '}' }},
      {{ '{' }} path: 'pages',      component: PagesListComponent  {{ '}' }},
      {{ '{' }} path: 'pages/:id',  component: PageEditorComponent {{ '}' }},
      {{ '{' }} path: 'posts',      component: PostsListComponent  {{ '}' }},
      {{ '{' }} path: 'posts/:id',  component: PostEditorComponent {{ '}' }},
      {{ '{' }}
        path: 'media',
        children: [
          {{ '{' }} path: '',        component: MediaLibraryComponent {{ '}' }},
          {{ '{' }} path: 'images',  component: ImagesComponent       {{ '}' }},
          {{ '{' }} path: 'videos',  component: VideosComponent       {{ '}' }},
          {{ '{' }} path: 'files',   component: FilesComponent        {{ '}' }},
        ]
      {{ '}' }},
    ]
  {{ '}' }}
];
    </pre>
  `
})
class Ex35 {}

// 36. App shell + nested features — code display
@Component({
  selector: 'ex-36', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// App shell pattern — layout + nested features
const routes: Routes = [
  // App shell wraps all authenticated routes
  {{ '{' }}
    path: '',
    component: AppShellComponent,  // header + sidebar + &lt;router-outlet&gt;
    canActivate: [authGuard],
    children: [
      {{ '{' }} path: '',           redirectTo: 'home', pathMatch: 'full' {{ '}' }},
      {{ '{' }} path: 'home',       loadComponent: () => import('./home') {{ '}' }},
      {{ '{' }} path: 'shop',       loadChildren: () => import('./shop/routes')    {{ '}' }},
      {{ '{' }} path: 'profile',    loadChildren: () => import('./profile/routes') {{ '}' }},
      {{ '{' }} path: 'settings',   loadChildren: () => import('./settings/routes'){{ '}' }},
      {{ '{' }} path: 'admin',      canActivate: [adminGuard],
                loadChildren: () => import('./admin/routes')              {{ '}' }},
    ]
  {{ '}' }},
  // Full-screen routes outside the shell
  {{ '{' }} path: 'login',     component: LoginComponent  {{ '}' }},
  {{ '{' }} path: 'error/:code', component: ErrorComponent {{ '}' }},
];
    </pre>
  `
})
class Ex36 {}

// 37. Secondary outlet for slide-over — signal toggle
@Component({
  selector: 'ex-37', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #795548;border-radius:6px">
      <p style="margin:0;font-weight:bold">Secondary Outlet (Slide-over Panel)</p>
      <pre style="background:#f5f5f5;font-size:11px;padding:8px;border-radius:4px;margin-top:8px">
// Route:
// {{ '{' }} path: 'detail/:id', outlet: 'panel', component: DetailPanelComponent {{ '}' }}

// Open panel:
// router.navigate([{{ '{' }} outlets: {{ '{' }} panel: ['detail', id] {{ '}' }} {{ '}' }}])

// Close panel:
// router.navigate([{{ '{' }} outlets: {{ '{' }} panel: null {{ '}' }} {{ '}' }}])
      </pre>
      <button (click)="open.set(!open())" style="padding:6px 14px;background:#795548;color:#fff;border:none;border-radius:4px;cursor:pointer;margin-top:6px">
        {{ open() ? 'Close Panel' : 'Open Detail Panel' }}
      </button>
      @if (open()) {
        <div style="position:relative;margin-top:8px;padding:12px;background:#efebe9;border-left:4px solid #795548;border-radius:0 4px 4px 0">
          <p style="margin:0;font-weight:bold">Detail Panel (secondary outlet)</p>
          <p style="margin:4px 0 0;font-size:12px;color:#555">URL: /dashboard(panel:detail/42)</p>
        </div>
      }
    </div>
  `
})
class Ex37 {
  open = signal(false);
}

// 38. Breadcrumb from nested hierarchy — signal array
@Component({
  selector: 'ex-38', standalone: true,
  template: `
    <div style="padding:10px;border:1px solid #4caf50;border-radius:6px">
      <p style="margin:0;font-weight:bold">Breadcrumb from Nested Route Hierarchy</p>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
        @for (path of paths; track path) {
          <button
            (click)="setCrumbs(path)"
            [style.background]="selected() === path ? '#4caf50' : '#eee'"
            [style.color]="selected() === path ? '#fff' : '#333'"
            style="padding:5px 12px;border:none;border-radius:4px;cursor:pointer;font-size:13px">
            {{ path }}
          </button>
        }
      </div>
      <div style="display:flex;align-items:center;gap:4px;margin-top:10px;font-size:13px;flex-wrap:wrap">
        @for (crumb of crumbs(); track crumb.label; let last = $last) {
          <span [style.color]="last ? '#333' : '#4caf50'" [style.font-weight]="last ? 'bold' : 'normal'" style="cursor:pointer">{{ crumb.label }}</span>
          @if (!last) { <span style="color:#9e9e9e">›</span> }
        }
      </div>
    </div>
  `
})
class Ex38 {
  paths = ['/home', '/shop/products', '/shop/products/42', '/shop/products/42/reviews'];
  selected = signal('/home');
  crumbs = signal([{ label: 'Home', url: '/' }]);
  setCrumbs(path: string) {
    this.selected.set(path);
    const map: Record<string, { label: string; url: string }[]> = {
      '/home': [{ label: 'Home', url: '/' }],
      '/shop/products': [{ label: 'Home', url: '/' }, { label: 'Shop', url: '/shop' }, { label: 'Products', url: '/shop/products' }],
      '/shop/products/42': [{ label: 'Home', url: '/' }, { label: 'Shop', url: '/shop' }, { label: 'Products', url: '/shop/products' }, { label: 'Product #42', url: '/shop/products/42' }],
      '/shop/products/42/reviews': [{ label: 'Home', url: '/' }, { label: 'Shop', url: '/shop' }, { label: 'Products', url: '/shop/products' }, { label: 'Product #42', url: '/shop/products/42' }, { label: 'Reviews', url: '/shop/products/42/reviews' }],
    };
    this.crumbs.set(map[path] ?? []);
  }
}

// ─── ADVANCED (39–50) ───────────────────────────────────────

// 39. componentless routes (pure layout) — code display
@Component({
  selector: 'ex-39', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Componentless route: no component, acts as group/guard/provider wrapper
const routes: Routes = [
  // Group: no component, just a guard + providers for children
  {{ '{' }}
    path: '',
    canActivate: [authGuard],
    providers: [AppStateService],
    children: [
      {{ '{' }} path: 'dashboard', component: DashboardComponent {{ '}' }},
      {{ '{' }} path: 'profile',   component: ProfileComponent   {{ '}' }},
    ]
  {{ '}' }},

  // Another group under a URL prefix
  {{ '{' }}
    path: 'api-explorer',
    canActivate: [devGuard],
    // No component — children use root router-outlet
    children: [
      {{ '{' }} path: 'rest',    component: RestExplorerComponent    {{ '}' }},
      {{ '{' }} path: 'graphql', component: GraphqlExplorerComponent {{ '}' }},
    ]
  {{ '}' }},
];
    </pre>
  `
})
class Ex39 {}

// 40. Named outlet activation/deactivation — code display
@Component({
  selector: 'ex-40', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Programmatic named outlet control
@Component({{ '{' }} standalone: true {{ '}' }})
export class AppShellComponent {{ '{' }}
  private router = inject(Router);

  openHelp(topic: string) {{ '{' }}
    this.router.navigate([
      {{ '{' }} outlets: {{ '{' }} sidebar: ['help', topic] {{ '}' }} {{ '}' }}
    ]);
    // URL: /dashboard(sidebar:help/routing)
  {{ '}' }}

  openChat() {{ '{' }}
    this.router.navigate([
      {{ '{' }} outlets: {{ '{' }} chat: ['messages'] {{ '}' }} {{ '}' }}
    ]);
  {{ '}' }}

  closeAll() {{ '{' }}
    this.router.navigate([{{ '{' }}
      outlets: {{ '{' }}
        sidebar: null,  // deactivate sidebar outlet
        chat:    null,  // deactivate chat outlet
      {{ '}' }}
    {{ '}' }}]);
  {{ '}' }}
{{ '}' }}
    </pre>
  `
})
class Ex40 {}

// 41. Multiple router-outlets strategy — code display
@Component({
  selector: 'ex-41', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// App template with multiple router-outlets
@Component({{ '{' }}
  template: \`
    &lt;app-header /&gt;

    &lt;main&gt;
      &lt;!-- Primary content --&gt;
      &lt;router-outlet /&gt;
    &lt;/main&gt;

    &lt;!-- Persistent sidebar — can be activated independently --&gt;
    &lt;aside&gt;
      &lt;router-outlet name="sidebar" /&gt;
    &lt;/aside&gt;

    &lt;!-- Modal layer --&gt;
    &lt;router-outlet name="modal" /&gt;

    &lt;app-footer /&gt;
  \`
{{ '}' }})
export class AppShellComponent {{ '{' }} {{ '}' }}

// Routes for each outlet:
{{ '{' }} path: 'help/:topic', outlet: 'sidebar', component: HelpComponent {{ '}' }},
{{ '{' }} path: 'confirm',     outlet: 'modal',   component: ConfirmDialog  {{ '}' }},
    </pre>
  `
})
class Ex41 {}

// 42. RouteReuseStrategy concept — code display
@Component({
  selector: 'ex-42', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// RouteReuseStrategy — cache and reuse component instances
import {{ '{' }} RouteReuseStrategy, ActivatedRouteSnapshot, DetachedRouteHandle {{ '}' }} from '@angular/router';

@Injectable()
export class AppRouteReuseStrategy extends RouteReuseStrategy {{ '{' }}
  private cache = new Map&lt;string, DetachedRouteHandle&gt;();

  // Should Angular detach and store this route?
  shouldDetach(route: ActivatedRouteSnapshot): boolean {{ '{' }}
    return !!route.data['reuse'];
  {{ '}' }}

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {{ '{' }}
    this.cache.set(this.key(route), handle);
  {{ '}' }}

  // Should Angular reattach a stored route?
  shouldAttach(route: ActivatedRouteSnapshot): boolean {{ '{' }}
    return this.cache.has(this.key(route));
  {{ '}' }}

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {{ '{' }}
    return this.cache.get(this.key(route)) ?? null;
  {{ '}' }}

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {{ '{' }}
    return future.routeConfig === curr.routeConfig;
  {{ '}' }}

  private key(route: ActivatedRouteSnapshot): string {{ '{' }}
    return route.pathFromRoot.map(r => r.url.join('/')).join('/');
  {{ '}' }}
{{ '}' }}
// Provide: {{ '{' }} provide: RouteReuseStrategy, useClass: AppRouteReuseStrategy {{ '}' }}
    </pre>
  `
})
class Ex42 {}

// 43. Deep linking support — code display
@Component({
  selector: 'ex-43', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Deep linking: sharing URLs that resolve to nested routes
// URL: /admin/users/42/activity?filter=comments&page=2

// The route tree that resolves this:
{{ '{' }} path: 'admin', children: [
  {{ '{' }} path: 'users', children: [
    {{ '{' }} path: ':id', children: [
      {{ '{' }} path: 'activity', component: UserActivityComponent {{ '}' }},
    ]{{ '}' }},
  ]{{ '}' }},
]{{ '}' }}

// UserActivityComponent reads all levels:
@Component({{ '{' }} standalone: true {{ '}' }})
class UserActivityComponent {{ '{' }}
  private route = inject(ActivatedRoute);
  userId   = toSignal(this.route.parent!.params.pipe(map(p => p['id'])));
  filter   = toSignal(this.route.queryParams.pipe(map(p => p['filter'])));
  page     = toSignal(this.route.queryParams.pipe(map(p => +p['page'] || 1)));
{{ '}' }}
    </pre>
  `
})
class Ex43 {}

// 44. Nested routes scroll restoration — code display
@Component({
  selector: 'ex-44', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Scroll restoration for nested route navigation
import {{ '{' }} provideRouter, withInMemoryScrolling {{ '}' }} from '@angular/router';

export const appConfig: ApplicationConfig = {{ '{' }}
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({{ '{' }}
        scrollPositionRestoration: 'enabled', // restore on back/forward
        anchorScrolling: 'enabled',           // scroll to #fragment
      {{ '}' }})
    ),
  ]
{{ '}' }};

// For nested routes: scroll the inner container, not window
// Use ViewportScroller service for programmatic scrolling:
@Component({{ '{' }} standalone: true {{ '}' }})
class NestedComponent {{ '{' }}
  private scroller = inject(ViewportScroller);
  scrollToTop() {{ '{' }} this.scroller.scrollToPosition([0, 0]); {{ '}' }}
  scrollTo(anchor: string) {{ '{' }} this.scroller.scrollToAnchor(anchor); {{ '}' }}
{{ '}' }}
    </pre>
  `
})
class Ex44 {}

// 45. Route animation host — code display
@Component({
  selector: 'ex-45', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Animate between nested routes using @routeAnimation trigger
@Component({{ '{' }}
  standalone: true,
  imports: [RouterOutlet],
  template: \`
    &lt;div [@routeAnimation]="getRouteState(outlet)"&gt;
      &lt;router-outlet #outlet="outlet" /&gt;
    &lt;/div&gt;
  \`,
  animations: [
    trigger('routeAnimation', [
      transition('* &lt;=&gt; *', [
        style({{ '{' }} opacity: 0, transform: 'translateX(20px)' {{ '}' }}),
        animate('200ms ease', style({{ '{' }} opacity: 1, transform: 'none' {{ '}' }}))
      ])
    ])
  ]
{{ '}' }})
export class ShellComponent {{ '{' }}
  getRouteState(outlet: RouterOutlet): string {{ '{' }}
    return outlet.activatedRouteData?.['animation'] ?? 'default';
  {{ '}' }}
{{ '}' }}

// Route data:
// {{ '{' }} path: 'profile',  data: {{ '{' }} animation: 'profile'  {{ '}' }}, component: ... {{ '}' }}
// {{ '{' }} path: 'settings', data: {{ '{' }} animation: 'settings' {{ '}' }}, component: ... {{ '}' }}
    </pre>
  `
})
class Ex45 {}

// 46. inheritParamData: 'always' — code display
@Component({
  selector: 'ex-46', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// paramsInheritanceStrategy: 'always' — full param + data inheritance
withRouterConfig({{ '{' }} paramsInheritanceStrategy: 'always' {{ '}' }})

// Before ('emptyOnly' default):
// Child at /users/:id/posts only sees its own params
// → route.snapshot.params = {{ '{' }} /* only child params */ {{ '}' }}

// After ('always'):
// Child at /users/:id/posts sees ALL ancestor params
// → route.snapshot.params = {{ '{' }} id: '42', /* + any parent params */ {{ '}' }}

// Useful for:
// - Deeply nested components reading ancestor IDs
// - Breadcrumb services reading the full param chain
// - Avoiding inject(ActivatedRoute).parent?.parent?.params chains

// Example:
// /org/:orgId/team/:teamId/member/:memberId
// With 'always': member route sees orgId, teamId, AND memberId
    </pre>
  `
})
class Ex46 {}

// 47. CanDeactivate on parent — code display
@Component({
  selector: 'ex-47', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// CanDeactivate on parent fires when leaving any child route
// useful for wizard/multi-step forms
export interface CanDeactivateWizard {{ '{' }}
  isDirty: Signal&lt;boolean&gt;;
{{ '}' }}

export const wizardGuard: CanDeactivateFn&lt;CanDeactivateWizard&gt; =
  (component) => {{ '{' }}
    if (!component.isDirty()) return true;
    return confirm('Leave wizard? Your progress will be lost.');
  {{ '}' }};

const routes: Routes = [
  {{ '{' }}
    path: 'checkout',
    component: CheckoutWizardComponent,  // implements CanDeactivateWizard
    canDeactivate: [wizardGuard],        // fires when navigating AWAY
    children: [
      {{ '{' }} path: 'cart',    component: CartStepComponent    {{ '}' }},
      {{ '{' }} path: 'address', component: AddressStepComponent {{ '}' }},
      {{ '{' }} path: 'payment', component: PaymentStepComponent {{ '}' }},
    ]
  {{ '}' }}
];
    </pre>
  `
})
class Ex47 {}

// 48. Selective preloading nested — code display
@Component({
  selector: 'ex-48', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Preload only nested routes the current user can access
@Injectable({{ '{' }} providedIn: 'root' {{ '}' }})
export class AuthAwarePreloadStrategy implements PreloadingStrategy {{ '{' }}
  private auth = inject(AuthService);

  preload(route: Route, load: () => Observable&lt;any&gt;): Observable&lt;any&gt; {{ '{' }}
    // Skip if route requires role user doesn't have
    const requiredRole = route.data?.['role'];
    if (requiredRole && !this.auth.hasRole(requiredRole)) {{ '{' }}
      return of(null); // don't preload routes the user can't access
    {{ '}' }}

    // Preload if marked, or all public routes
    return route.data?.['preload'] !== false ? load() : of(null);
  {{ '}' }}
{{ '}' }}
    </pre>
  `
})
class Ex48 {}

// 49. Secondary outlet URL — code display
@Component({
  selector: 'ex-49', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Secondary outlet URL format
// Primary: /dashboard
// With one secondary: /dashboard(chat:messages)
// With two secondaries: /dashboard(chat:messages//modal:confirm)

// Angular Router URL tree structure:
// ├── Primary: /dashboard
// ├── Outlet chat: /messages
// └── Outlet modal: /confirm

// Navigate with multiple outlets:
this.router.navigate([
  '/dashboard',
  {{ '{' }} outlets: {{ '{' }}
    primary: ['dashboard'],  // optional if already there
    chat:    ['messages'],
    modal:   ['confirm', {{ '{' }} action: 'delete', id: 42 {{ '}' }}],
  {{ '}' }} {{ '}' }}
]);

// Clear secondary outlets:
this.router.navigate([
  {{ '{' }} outlets: {{ '{' }} chat: null, modal: null {{ '}' }} {{ '}' }}
]);

// Read secondary outlet params:
// const modalParams = route.snapshot.children
//   .find(c => c.outlet === 'modal')?.params;
    </pre>
  `
})
class Ex49 {}

// 50. Full enterprise nested routing architecture — code display
@Component({
  selector: 'ex-50', standalone: true,
  template: `
    <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;font-size:12px;overflow:auto">
// Enterprise nested routing: all patterns combined
// app.config.ts
provideRouter(routes,
  withPreloading(AuthAwarePreloadStrategy),
  withComponentInputBinding(),
  withViewTransitions(),
  withInMemoryScrolling({{ '{' }} scrollPositionRestoration: 'enabled' {{ '}' }}),
  withRouterConfig({{ '{' }} paramsInheritanceStrategy: 'always' {{ '}' }})
)

// app.routes.ts
export const routes: Routes = [
  // Auth shell (guest only)
  {{ '{' }} path: 'auth', component: AuthLayoutComponent,
    canActivate: [guestGuard],
    children: [
      {{ '{' }} path: '', redirectTo: 'login', pathMatch: 'full' {{ '}' }},
      {{ '{' }} path: 'login', component: LoginComponent {{ '}' }},
    ]{{ '}' }},

  // App shell (authenticated)
  {{ '{' }}
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    canActivateChild: [sessionGuard],
    resolve: {{ '{' }} config: appConfigResolver {{ '}' }},
    children: [
      {{ '{' }} path: '', redirectTo: 'home', pathMatch: 'full' {{ '}' }},
      {{ '{' }} path: 'home',     loadComponent: () => import('./home')    {{ '}' }},
      {{ '{' }} path: 'shop',     loadChildren: () => import('./shop/routes'),
                data: {{ '{' }} preload: true {{ '}' }}                                   {{ '}' }},
      {{ '{' }}
        path: 'user/:userId',
        resolve: {{ '{' }} user: userResolver {{ '}' }},
        component: UserShellComponent,
        children: [
          {{ '{' }} path: '',         redirectTo: 'profile', pathMatch: 'full' {{ '}' }},
          {{ '{' }} path: 'profile',  component: UserProfileComponent {{ '}' }},
          {{ '{' }} path: 'activity', component: UserActivityComponent,
                    resolve: {{ '{' }} activity: activityResolver {{ '}' }} {{ '}' }},
        ]
      {{ '}' }},
      {{ '{' }}
        path: 'admin',
        canActivate: [adminGuard],
        loadChildren: () => import('./admin/routes')
      {{ '}' }},
    ]
  {{ '}' }},
  // Named outlets
  {{ '{' }} path: 'help/:topic', outlet: 'sidebar', component: HelpComponent {{ '}' }},
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
      <h1>Examples 6.5 — Nested Routes</h1>
      <h4>1. children array config</h4><ex-01 /><hr />
      <h4>2. Nested router-outlet</h4><ex-02 /><hr />
      <h4>3. Child route with params</h4><ex-03 /><hr />
      <h4>4. Default child path ''</h4><ex-04 /><hr />
      <h4>5. Redirect child</h4><ex-05 /><hr />
      <h4>6. pathMatch: 'full'</h4><ex-06 /><hr />
      <h4>7. Componentless layout route</h4><ex-07 /><hr />
      <h4>8. Named outlet concept</h4><ex-08 /><hr />
      <h4>9. Primary vs secondary outlet</h4><ex-09 /><hr />
      <h4>10. Relative RouterLink ./child simulation</h4><ex-10 /><hr />
      <h4>11. Relative RouterLink ../sibling simulation</h4><ex-11 /><hr />
      <h4>12. ActivatedRoute parent</h4><ex-12 /><hr />
      <h4>13. Route data on child</h4><ex-13 /><hr />
      <h4>14. 3-level nesting structure</h4><ex-14 /><hr />
      <h4>15. Multi-level relative navigation</h4><ex-15 /><hr />
      <h4>16. Route data inheritance</h4><ex-16 /><hr />
      <h4>17. Param inheritance</h4><ex-17 /><hr />
      <h4>18. Tab interface (signal simulation)</h4><ex-18 /><hr />
      <h4>19. Settings page sub-routes</h4><ex-19 /><hr />
      <h4>20. Dashboard nested sections</h4><ex-20 /><hr />
      <h4>21. Auth layout route pattern</h4><ex-21 /><hr />
      <h4>22. Children with individual guards</h4><ex-22 /><hr />
      <h4>23. Children with individual resolvers</h4><ex-23 /><hr />
      <h4>24. Children with different titles</h4><ex-24 /><hr />
      <h4>25. canActivateChild</h4><ex-25 /><hr />
      <h4>26. Empty path full children setup</h4><ex-26 /><hr />
      <h4>27. Full dashboard: sidebar + nested content</h4><ex-27 /><hr />
      <h4>28. E-commerce: catalog → product → reviews</h4><ex-28 /><hr />
      <h4>29. Blog: category → post → comments</h4><ex-29 /><hr />
      <h4>30. Profile: activity/settings/friends tabs</h4><ex-30 /><hr />
      <h4>31. Admin: users/posts/settings</h4><ex-31 /><hr />
      <h4>32. Wizard: step1→step2→step3→review</h4><ex-32 /><hr />
      <h4>33. Document viewer: tree + content</h4><ex-33 /><hr />
      <h4>34. Multi-tenant routing structure</h4><ex-34 /><hr />
      <h4>35. CMS nested content types</h4><ex-35 /><hr />
      <h4>36. App shell + nested features</h4><ex-36 /><hr />
      <h4>37. Secondary outlet for slide-over</h4><ex-37 /><hr />
      <h4>38. Breadcrumb from nested hierarchy</h4><ex-38 /><hr />
      <h4>39. Componentless routes (pure layout)</h4><ex-39 /><hr />
      <h4>40. Named outlet activation/deactivation</h4><ex-40 /><hr />
      <h4>41. Multiple router-outlets strategy</h4><ex-41 /><hr />
      <h4>42. RouteReuseStrategy concept</h4><ex-42 /><hr />
      <h4>43. Deep linking support</h4><ex-43 /><hr />
      <h4>44. Nested routes scroll restoration</h4><ex-44 /><hr />
      <h4>45. Route animation host</h4><ex-45 /><hr />
      <h4>46. inheritParamData: 'always'</h4><ex-46 /><hr />
      <h4>47. CanDeactivate on parent</h4><ex-47 /><hr />
      <h4>48. Selective preloading nested</h4><ex-48 /><hr />
      <h4>49. Secondary outlet URL</h4><ex-49 /><hr />
      <h4>50. Full enterprise nested routing architecture</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
