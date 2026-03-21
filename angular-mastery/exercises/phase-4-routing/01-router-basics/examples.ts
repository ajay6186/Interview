import { Component, signal, computed, inject } from '@angular/core';

// ============================================================
// Examples 4.1 — Router Basics (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// NOTE: Routing concepts are demonstrated via signal-based navigation state
// and code patterns shown in comments/templates (no actual Router DI needed)
// ============================================================

// ─── BASIC (1–13) ────────────────────────────────────────────

// 1. RouterLink usage demo — shows anchor pattern
@Component({
  selector: 'ex-01', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">RouterLink turns anchor elements into router-aware links.</p>
    <nav style="display:flex;gap:8px">
      <!-- <a routerLink="/home">Home</a> -->
      <!-- <a routerLink="/about">About</a> -->
      <a href="#" style="color:royalblue" (click)="$event.preventDefault()">Home (simulated)</a>
      <a href="#" style="color:royalblue" (click)="$event.preventDefault()">About (simulated)</a>
    </nav>
    <code style="font-size:11px">routerLink="/home" — directive on &lt;a&gt; or button</code>
  `
})
class Ex01 {}

// 2. RouterLinkActive demo — active class on current link
@Component({
  selector: 'ex-02', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">routerLinkActive applies a CSS class when the route is active.</p>
    <nav style="display:flex;gap:8px">
      <span [style.fontWeight]="active() === 'home' ? 'bold' : 'normal'"
            [style.color]="active() === 'home' ? 'royalblue' : 'inherit'"
            (click)="active.set('home')" style="cursor:pointer">Home</span>
      <span [style.fontWeight]="active() === 'about' ? 'bold' : 'normal'"
            [style.color]="active() === 'about' ? 'royalblue' : 'inherit'"
            (click)="active.set('about')" style="cursor:pointer">About</span>
    </nav>
    <code style="font-size:11px">routerLinkActive="active-class"</code>
  `
})
class Ex02 { active = signal('home'); }

// 3. router-outlet placeholder
@Component({
  selector: 'ex-03', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">&lt;router-outlet&gt; is where routed components render.</p>
    <div style="border:2px dashed #aaa;padding:12px;border-radius:4px;min-height:40px">
      <!-- &lt;router-outlet /&gt; goes here -->
      <span style="color:#aaa;font-size:12px">[ router-outlet renders routed component here ]</span>
    </div>
    <code style="font-size:11px">&lt;router-outlet /&gt;</code>
  `
})
class Ex03 {}

// 4. provideRouter config
@Component({
  selector: 'ex-04', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">provideRouter configures the router in bootstrapApplication.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ config }}</pre>
  `
})
class Ex04 {
  config = `bootstrapApplication(AppComponent, {
  providers: [
    provideRouter([
      { path: 'home', component: HomeComponent },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ])
  ]
})`;
}

// 5. navigate() programmatic navigation
@Component({
  selector: 'ex-05', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">router.navigate() navigates programmatically.</p>
    <button (click)="simulateNav('/dashboard')" style="margin-right:8px">Go to /dashboard</button>
    <button (click)="simulateNav('/profile')">Go to /profile</button>
    <p style="font-size:12px">Last navigated to: <strong>{{ destination() }}</strong></p>
    <code style="font-size:11px">router.navigate(['/dashboard'])</code>
  `
})
class Ex05 {
  destination = signal('(none)');
  simulateNav(path: string) { this.destination.set(path); }
}

// 6. navigateByUrl()
@Component({
  selector: 'ex-06', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">router.navigateByUrl() accepts a full URL string.</p>
    <button (click)="go()">Navigate to /products/42?ref=home</button>
    <p style="font-size:12px">URL: <strong>{{ url() }}</strong></p>
    <code style="font-size:11px">router.navigateByUrl('/products/42?ref=home')</code>
  `
})
class Ex06 {
  url = signal('(none)');
  go() { this.url.set('/products/42?ref=home'); }
}

// 7. Router events — NavigationStart/End/Cancel/Error
@Component({
  selector: 'ex-07', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Router emits NavigationStart, NavigationEnd, NavigationCancel, NavigationError events.</p>
    <div style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">
      <div>NavigationStart → id, url</div>
      <div>NavigationEnd → id, url, urlAfterRedirects</div>
      <div>NavigationCancel → id, url, reason</div>
      <div>NavigationError → id, url, error</div>
    </div>
    <code style="font-size:11px">router.events.pipe(filter(e => e instanceof NavigationStart))</code>
  `
})
class Ex07 {}

// 8. isActive check
@Component({
  selector: 'ex-08', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">router.isActive() checks if a URL is active.</p>
    <button (click)="check()">Check if /home is active</button>
    <p style="font-size:12px">Result: <strong>{{ result() }}</strong></p>
    <code style="font-size:11px">router.isActive('/home', &#123; exact: true, ... &#125;)</code>
  `
})
class Ex08 {
  result = signal('click to check');
  check() { this.result.set('true (simulated — current route is /home)'); }
}

// 9. href vs routerLink difference
@Component({
  selector: 'ex-09', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Difference between href and routerLink:</p>
    <table style="font-size:11px;border-collapse:collapse;width:100%">
      <tr style="background:#f4f4f4"><th style="padding:4px;text-align:left">href</th><th style="padding:4px;text-align:left">routerLink</th></tr>
      <tr><td style="padding:4px">Full page reload</td><td style="padding:4px">SPA navigation (no reload)</td></tr>
      <tr><td style="padding:4px">Loses Angular state</td><td style="padding:4px">Preserves Angular state</td></tr>
      <tr><td style="padding:4px">No router awareness</td><td style="padding:4px">Works with guards/resolvers</td></tr>
    </table>
  `
})
class Ex09 {}

// 10. routerLink with string
@Component({
  selector: 'ex-10', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">routerLink can accept a plain string path.</p>
    <code style="font-size:11px;display:block;background:#f4f4f4;padding:6px">&lt;a routerLink="/about"&gt;About&lt;/a&gt;</code>
    <p style="font-size:12px">String form: routerLink="/about" — absolute path</p>
  `
})
class Ex10 {}

// 11. routerLink with array
@Component({
  selector: 'ex-11', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">routerLink array form for dynamic segments.</p>
    <code style="font-size:11px;display:block;background:#f4f4f4;padding:6px">&lt;a [routerLink]="['/products', productId]"&gt;Product&lt;/a&gt;</code>
    <p style="font-size:12px">Array: ['/products', 42] → /products/42</p>
    <button (click)="id.set(id() + 1)">Change ID: {{ id() }}</button>
  `
})
class Ex11 { id = signal(42); }

// 12. routerLink relative navigation
@Component({
  selector: 'ex-12', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">routerLink supports relative paths (no leading slash).</p>
    <div style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">
      <div>&lt;a routerLink="detail"&gt; — relative to current</div>
      <div>&lt;a routerLink="../sibling"&gt; — up one level</div>
      <div>&lt;a routerLink="./child"&gt; — explicit current-dir relative</div>
    </div>
  `
})
class Ex12 {}

// 13. routerLink with fragment
@Component({
  selector: 'ex-13', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">routerLink fragment scrolls to an anchor on the page.</p>
    <code style="font-size:11px;display:block;background:#f4f4f4;padding:6px">&lt;a [routerLink]="['/docs']" fragment="api"&gt;API section&lt;/a&gt;</code>
    <p style="font-size:12px">Navigates to /docs#api</p>
  `
})
class Ex13 {}

// ─── INTERMEDIATE (14–26) ─────────────────────────────────────

// 14. routerLinkActiveOptions exact
@Component({
  selector: 'ex-14', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">routerLinkActiveOptions with exact:true prevents parent match.</p>
    <code style="font-size:11px;display:block;background:#f4f4f4;padding:6px">
      [routerLinkActiveOptions]="&#123; exact: true &#125;"
    </code>
    <p style="font-size:12px">Without exact: /users matches /users AND /users/42</p>
    <p style="font-size:12px">With exact: /users only matches /users</p>
  `
})
class Ex14 {}

// 15. RouterLinkActive on parent element
@Component({
  selector: 'ex-15', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">routerLinkActive can be placed on a parent wrapping element.</p>
    <code style="font-size:11px;display:block;background:#f4f4f4;padding:6px">
      &lt;li routerLinkActive="active"&gt;
        &lt;a routerLink="/home"&gt;Home&lt;/a&gt;
      &lt;/li&gt;
    </code>
    <p style="font-size:12px">The &lt;li&gt; gets the "active" class when /home is active</p>
  `
})
class Ex15 {}

// 16. Router.navigate with NavigationExtras
@Component({
  selector: 'ex-16', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">router.navigate() accepts NavigationExtras as second arg.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <button (click)="log()">Simulate navigate with extras</button>
    <p style="font-size:12px">{{ result() }}</p>
  `
})
class Ex16 {
  result = signal('');
  code = `router.navigate(['/search'], {
  queryParams: { q: 'angular' },
  fragment: 'results'
})`;
  log() { this.result.set('Navigated to /search?q=angular#results'); }
}

// 17. NavigationExtras queryParams
@Component({
  selector: 'ex-17', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">queryParams extra attaches query params to navigation.</p>
    <input [value]="search()" (input)="search.set($any($event).target.value)" placeholder="Search term..." />
    <button (click)="nav()">Navigate</button>
    <p style="font-size:12px">Would navigate to: <strong>{{ url() }}</strong></p>
  `
})
class Ex17 {
  search = signal('angular');
  url = signal('/search?q=angular');
  nav() { this.url.set('/search?q=' + encodeURIComponent(this.search())); }
}

// 18. NavigationExtras fragment
@Component({
  selector: 'ex-18', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">fragment extra appends a hash fragment to the URL.</p>
    <code style="font-size:11px;display:block;background:#f4f4f4;padding:6px">
      router.navigate(['/docs'], &#123; fragment: 'getting-started' &#125;)
    </code>
    <p style="font-size:12px">Result URL: /docs#getting-started</p>
  `
})
class Ex18 {}

// 19. skipLocationChange extra
@Component({
  selector: 'ex-19', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">skipLocationChange navigates without updating the browser URL bar.</p>
    <code style="font-size:11px;display:block;background:#f4f4f4;padding:6px">
      router.navigate(['/temp'], &#123; skipLocationChange: true &#125;)
    </code>
    <p style="font-size:12px">Useful for wizard steps or internal navigation that shouldn't be bookmarked.</p>
  `
})
class Ex19 {}

// 20. replaceUrl extra
@Component({
  selector: 'ex-20', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">replaceUrl replaces the current history entry instead of pushing a new one.</p>
    <code style="font-size:11px;display:block;background:#f4f4f4;padding:6px">
      router.navigate(['/dashboard'], &#123; replaceUrl: true &#125;)
    </code>
    <p style="font-size:12px">Back button won't return to the previous route when replaceUrl is true.</p>
  `
})
class Ex20 {}

// 21. Router events tap (loading indicator)
@Component({
  selector: 'ex-21', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Tapping router events enables a loading indicator.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <div [style.opacity]="loading() ? 1 : 0.3"
         style="height:4px;background:royalblue;border-radius:2px;transition:opacity .3s"></div>
    <button (click)="simulateNav()">Simulate navigation</button>
  `
})
class Ex21 {
  loading = signal(false);
  code = `router.events.pipe(
  tap(e => {
    if (e instanceof NavigationStart) loading.set(true);
    if (e instanceof NavigationEnd) loading.set(false);
  })
).subscribe()`;
  simulateNav() {
    this.loading.set(true);
    setTimeout(() => this.loading.set(false), 1200);
  }
}

// 22. NavigationStart / NavigationEnd / NavigationCancel events
@Component({
  selector: 'ex-22', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Key router event classes and their properties:</p>
    <table style="font-size:11px;border-collapse:collapse;width:100%">
      @for (ev of events; track ev.name) {
        <tr style="border-bottom:1px solid #eee">
          <td style="padding:4px;font-weight:bold;color:royalblue">{{ ev.name }}</td>
          <td style="padding:4px">{{ ev.props }}</td>
        </tr>
      }
    </table>
  `
})
class Ex22 {
  events = [
    { name: 'NavigationStart', props: 'id, url, navigationTrigger' },
    { name: 'NavigationEnd', props: 'id, url, urlAfterRedirects' },
    { name: 'NavigationCancel', props: 'id, url, reason, code' },
    { name: 'NavigationError', props: 'id, url, error' },
    { name: 'RoutesRecognized', props: 'id, url, urlAfterRedirects, state' },
  ];
}

// 23. router.url signal (current URL)
@Component({
  selector: 'ex-23', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">router.url returns the current URL string (sync snapshot).</p>
    <code style="font-size:11px;display:block;background:#f4f4f4;padding:6px">
      currentUrl = inject(Router).url;
    </code>
    <p style="font-size:12px">Simulated current URL: <strong>{{ currentUrl() }}</strong></p>
    <button (click)="change()">Change route</button>
  `
})
class Ex23 {
  routes = ['/home', '/about', '/products', '/contact'];
  idx = 0;
  currentUrl = signal(this.routes[0]);
  change() { this.idx = (this.idx + 1) % this.routes.length; this.currentUrl.set(this.routes[this.idx]); }
}

// 24. router.events Observable
@Component({
  selector: 'ex-24', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">router.events is a cold Observable emitting all router events.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
  `
})
class Ex24 {
  code = `const router = inject(Router);
router.events.pipe(
  filter(e => e instanceof NavigationEnd),
  map(e => (e as NavigationEnd).urlAfterRedirects)
).subscribe(url => console.log('Navigated to:', url));`;
}

// 25. router.navigateByUrl vs navigate comparison
@Component({
  selector: 'ex-25', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">navigate vs navigateByUrl:</p>
    <table style="font-size:11px;border-collapse:collapse;width:100%">
      <tr style="background:#f4f4f4"><th style="padding:4px;text-align:left">navigate</th><th style="padding:4px;text-align:left">navigateByUrl</th></tr>
      <tr><td style="padding:4px">Accepts array of segments</td><td style="padding:4px">Accepts full URL string</td></tr>
      <tr><td style="padding:4px">Supports NavigationExtras</td><td style="padding:4px">Supports NavigationExtras</td></tr>
      <tr><td style="padding:4px">Type-safe segment array</td><td style="padding:4px">Parses URL string</td></tr>
      <tr><td style="padding:4px">router.navigate(['/a', id])</td><td style="padding:4px">router.navigateByUrl('/a/42')</td></tr>
    </table>
  `
})
class Ex25 {}

// 26. withHashLocation strategy
@Component({
  selector: 'ex-26', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">withHashLocation() enables hash-based URLs (/#/path) for servers that can't handle HTML5 URLs.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <p style="font-size:12px">URLs look like: http://app.com/#/home instead of http://app.com/home</p>
  `
})
class Ex26 {
  code = `provideRouter(routes, withHashLocation())`;
}

// ─── NESTED (27–38) ───────────────────────────────────────────

// 27. Full nav component with RouterLink simulation
@Component({
  selector: 'ex-27', standalone: true,
  template: `
    <nav style="display:flex;gap:0;border-bottom:2px solid #eee">
      @for (item of navItems; track item.path) {
        <span
          (click)="active.set(item.path)"
          [style.borderBottom]="active() === item.path ? '2px solid royalblue' : '2px solid transparent'"
          [style.color]="active() === item.path ? 'royalblue' : 'inherit'"
          [style.fontWeight]="active() === item.path ? 'bold' : 'normal'"
          style="padding:8px 16px;cursor:pointer;margin-bottom:-2px">
          {{ item.label }}
        </span>
      }
    </nav>
    <div style="padding:8px;font-size:12px">Viewing: <strong>{{ active() }}</strong></div>
  `
})
class Ex27 {
  active = signal('/home');
  navItems = [
    { path: '/home', label: 'Home' }, { path: '/about', label: 'About' },
    { path: '/products', label: 'Products' }, { path: '/contact', label: 'Contact' }
  ];
}

// 28. Breadcrumb with Router simulation
@Component({
  selector: 'ex-28', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Breadcrumb built from activated route data.</p>
    <nav style="display:flex;gap:4px;align-items:center;font-size:13px">
      @for (crumb of breadcrumbs(); track crumb.path; let last = $last) {
        @if (!last) {
          <span (click)="navigate(crumb.path)" style="color:royalblue;cursor:pointer">{{ crumb.label }}</span>
          <span style="color:#aaa">/</span>
        } @else {
          <span style="color:#333;font-weight:bold">{{ crumb.label }}</span>
        }
      }
    </nav>
    <button style="font-size:11px;margin-top:6px" (click)="drill()">Go deeper</button>
  `
})
class Ex28 {
  allCrumbs = [
    [{ path: '/', label: 'Home' }],
    [{ path: '/', label: 'Home' }, { path: '/products', label: 'Products' }],
    [{ path: '/', label: 'Home' }, { path: '/products', label: 'Products' }, { path: '/products/42', label: 'Widget Pro' }],
  ];
  idx = 0;
  breadcrumbs = signal(this.allCrumbs[0]);
  navigate(path: string) { this.breadcrumbs.set([{ path, label: path }]); }
  drill() { this.idx = (this.idx + 1) % this.allCrumbs.length; this.breadcrumbs.set(this.allCrumbs[this.idx]); }
}

// 29. Side menu with RouterLinkActive simulation
@Component({
  selector: 'ex-29', standalone: true,
  template: `
    <div style="display:flex;gap:0;border:1px solid #eee;border-radius:4px;overflow:hidden;font-size:13px">
      <aside style="width:120px;background:#f8f8f8;border-right:1px solid #eee">
        @for (item of menu; track item.path) {
          <div (click)="active.set(item.path)"
               [style.background]="active() === item.path ? 'royalblue' : 'transparent'"
               [style.color]="active() === item.path ? 'white' : 'inherit'"
               style="padding:8px 12px;cursor:pointer">
            {{ item.label }}
          </div>
        }
      </aside>
      <main style="flex:1;padding:12px">
        <strong>{{ active() }}</strong>
        <p style="font-size:11px;color:#888">Route content renders in &lt;router-outlet&gt;</p>
      </main>
    </div>
  `
})
class Ex29 {
  active = signal('/dashboard');
  menu = [
    { path: '/dashboard', label: 'Dashboard' }, { path: '/users', label: 'Users' },
    { path: '/reports', label: 'Reports' }, { path: '/settings', label: 'Settings' }
  ];
}

// 30. Tab component with router-based selection
@Component({
  selector: 'ex-30', standalone: true,
  template: `
    <div style="font-size:13px">
      <div style="display:flex;border-bottom:2px solid #eee">
        @for (tab of tabs; track tab.path) {
          <span (click)="activeTab.set(tab.path)"
                [style.borderBottom]="activeTab() === tab.path ? '2px solid royalblue' : '2px solid transparent'"
                [style.color]="activeTab() === tab.path ? 'royalblue' : '#666'"
                style="padding:6px 16px;cursor:pointer;margin-bottom:-2px">
            {{ tab.label }}
          </span>
        }
      </div>
      <div style="padding:12px;border:1px solid #eee;border-top:none">
        @switch (activeTab()) {
          @case ('/overview') { <p>Overview content — route: /product/overview</p> }
          @case ('/specs') { <p>Specs content — route: /product/specs</p> }
          @case ('/reviews') { <p>Reviews content — route: /product/reviews</p> }
        }
      </div>
    </div>
  `
})
class Ex30 {
  activeTab = signal('/overview');
  tabs = [
    { path: '/overview', label: 'Overview' }, { path: '/specs', label: 'Specs' },
    { path: '/reviews', label: 'Reviews' }
  ];
}

// 31. Navigation guard integration demo
@Component({
  selector: 'ex-31', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Guards are checked before route activation.</p>
    <div style="font-size:12px">
      <label><input type="checkbox" [checked]="isLoggedIn()" (change)="isLoggedIn.set(!isLoggedIn())" /> Logged in</label>
    </div>
    <button (click)="tryNavigate()">Try navigate to /admin</button>
    <div style="margin-top:6px;padding:6px;border-radius:4px"
         [style.background]="navResult() === 'allowed' ? '#d4edda' : '#f8d7da'"
         [style.color]="navResult() === 'allowed' ? '#155724' : '#721c24'">
      {{ message() }}
    </div>
    <code style="font-size:11px">canActivate: [authGuard]</code>
  `
})
class Ex31 {
  isLoggedIn = signal(false);
  navResult = signal('none');
  message = computed(() => this.navResult() === 'allowed' ? 'Navigation allowed — user is authenticated' : this.navResult() === 'blocked' ? 'Redirected to /login — not authenticated' : 'Click button to test guard');
  tryNavigate() { this.navResult.set(this.isLoggedIn() ? 'allowed' : 'blocked'); }
}

// 32. Router events loading indicator
@Component({
  selector: 'ex-32', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Global loading bar driven by NavigationStart/End events.</p>
    <div style="height:4px;background:#eee;border-radius:2px;overflow:hidden">
      <div [style.width]="loading() ? '100%' : '0'"
           style="height:100%;background:royalblue;transition:width 1s ease"></div>
    </div>
    <button (click)="simulateNav()" style="margin-top:6px">Simulate navigation</button>
    <p style="font-size:12px">{{ loading() ? 'Navigating...' : 'Idle' }}</p>
  `
})
class Ex32 {
  loading = signal(false);
  simulateNav() {
    this.loading.set(true);
    setTimeout(() => this.loading.set(false), 1200);
  }
}

// 33. Deep nested navigation demo
@Component({
  selector: 'ex-33', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Deep nested route URL structure.</p>
    <div style="font-size:12px">
      @for (route of routes; track route) {
        <div style="padding:2px 0">
          <code style="background:#f4f4f4;padding:2px 6px;border-radius:3px">{{ route }}</code>
        </div>
      }
    </div>
    <p style="font-size:11px;color:#888;margin-top:6px">Each level has its own &lt;router-outlet&gt;</p>
  `
})
class Ex33 {
  routes = [
    '/app/admin/users/42/permissions/edit',
    '/app/dashboard/reports/2024/q1',
    '/app/settings/profile/security/2fa',
  ];
}

// 34. Multi-level menu with RouterLink
@Component({
  selector: 'ex-34', standalone: true,
  template: `
    <nav style="font-size:13px">
      @for (item of menu; track item.label) {
        <div style="margin-bottom:4px">
          <span (click)="item.expanded = !item.expanded"
                style="font-weight:bold;cursor:pointer;color:royalblue">
            {{ item.expanded ? '▼' : '►' }} {{ item.label }}
          </span>
          @if (item.expanded) {
            <div style="padding-left:16px">
              @for (child of item.children; track child.label) {
                <div style="padding:2px 0;cursor:pointer;color:#555"
                     (click)="active.set(child.path)">
                  {{ active() === child.path ? '● ' : '○ ' }}{{ child.label }}
                </div>
              }
            </div>
          }
        </div>
      }
    </nav>
    <p style="font-size:11px;color:#888">Active: {{ active() }}</p>
  `
})
class Ex34 {
  active = signal('');
  menu = [
    { label: 'Products', expanded: true, children: [{ label: 'List', path: '/products' }, { label: 'New', path: '/products/new' }] },
    { label: 'Admin', expanded: false, children: [{ label: 'Users', path: '/admin/users' }, { label: 'Roles', path: '/admin/roles' }] },
  ];
}

// 35. Footer with router links simulation
@Component({
  selector: 'ex-35', standalone: true,
  template: `
    <footer style="background:#333;color:#ccc;padding:16px;border-radius:4px;font-size:12px">
      <div style="display:flex;gap:24px;flex-wrap:wrap">
        @for (col of footerCols; track col.title) {
          <div>
            <p style="color:white;font-weight:bold;margin:0 0 6px">{{ col.title }}</p>
            @for (link of col.links; track link.label) {
              <div (click)="nav.set(link.path)" style="cursor:pointer;margin-bottom:2px;color:#aaa">
                {{ link.label }}
              </div>
            }
          </div>
        }
      </div>
      <p style="margin-top:12px;font-size:11px;color:#666">Last clicked: {{ nav() }}</p>
    </footer>
  `
})
class Ex35 {
  nav = signal('(none)');
  footerCols = [
    { title: 'Company', links: [{ label: 'About', path: '/about' }, { label: 'Careers', path: '/careers' }] },
    { title: 'Legal', links: [{ label: 'Privacy', path: '/privacy' }, { label: 'Terms', path: '/terms' }] },
    { title: 'Help', links: [{ label: 'Docs', path: '/docs' }, { label: 'Contact', path: '/contact' }] },
  ];
}

// 36. Programmatic navigation from service
@Component({
  selector: 'ex-36', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Navigation service wraps Router for testability.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <button (click)="go()">Navigate to dashboard</button>
    <p style="font-size:12px">{{ result() }}</p>
  `
})
class Ex36 {
  result = signal('');
  code = `@Injectable({ providedIn: 'root' })
class NavService {
  private router = inject(Router);
  toDashboard() { this.router.navigate(['/dashboard']); }
  toProduct(id: number) { this.router.navigate(['/products', id]); }
}`;
  go() { this.result.set('NavService.toDashboard() called → navigating to /dashboard'); }
}

// 37. Auth-aware nav links
@Component({
  selector: 'ex-37', standalone: true,
  template: `
    <div style="font-size:13px">
      <label><input type="checkbox" [checked]="loggedIn()" (change)="loggedIn.set(!loggedIn())" /> Logged in as Admin</label>
    </div>
    <nav style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap">
      <span style="padding:4px 10px;background:#eee;border-radius:4px;cursor:pointer">Home</span>
      <span style="padding:4px 10px;background:#eee;border-radius:4px;cursor:pointer">Products</span>
      @if (loggedIn()) {
        <span style="padding:4px 10px;background:royalblue;color:white;border-radius:4px;cursor:pointer">Dashboard</span>
        <span style="padding:4px 10px;background:royalblue;color:white;border-radius:4px;cursor:pointer">Admin</span>
        <span style="padding:4px 10px;background:#eee;border-radius:4px;cursor:pointer">Logout</span>
      } @else {
        <span style="padding:4px 10px;background:green;color:white;border-radius:4px;cursor:pointer">Login</span>
      }
    </nav>
  `
})
class Ex37 { loggedIn = signal(false); }

// 38. Route change animation trigger
@Component({
  selector: 'ex-38', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Animate route transitions on NavigationEnd.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <button (click)="trigger()">Simulate route change</button>
    <div [style.opacity]="visible() ? 1 : 0"
         [style.transform]="visible() ? 'translateY(0)' : 'translateY(10px)'"
         style="padding:8px;background:#e8f0fe;border-radius:4px;margin-top:6px;transition:all .4s">
      Page content faded in
    </div>
  `
})
class Ex38 {
  visible = signal(true);
  code = `router.events.pipe(filter(e => e instanceof NavigationEnd))
  .subscribe(() => { visible.set(false); setTimeout(() => visible.set(true), 50); })`;
  trigger() { this.visible.set(false); setTimeout(() => this.visible.set(true), 300); }
}

// ─── ADVANCED (39–50) ─────────────────────────────────────────

// 39. withComponentInputBinding — route params as @Input
@Component({
  selector: 'ex-39', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">withComponentInputBinding() maps route params/data/queryParams to @Input().</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <p style="font-size:12px">Simulated @Input id: <strong>{{ id }}</strong></p>
  `
})
class Ex39 {
  id = '42'; // Would be bound from route param :id
  code = `// In provideRouter:
provideRouter(routes, withComponentInputBinding())

// In component:
@Component({...})
class ProductDetailComponent {
  @Input() id!: string; // auto-bound from route :id
}`;
}

// 40. toSignal(router.events)
@Component({
  selector: 'ex-40', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">toSignal() converts router.events Observable to a Signal.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <p style="font-size:12px">Signal-based router event handling — no manual subscribe/unsubscribe needed.</p>
  `
})
class Ex40 {
  code = `import { toSignal } from '@angular/core/rxjs-interop';

@Component({...})
class AppComponent {
  private router = inject(Router);
  routerEvent = toSignal(
    this.router.events.pipe(filter(e => e instanceof NavigationEnd))
  );
  currentUrl = computed(() => (this.routerEvent() as NavigationEnd)?.url ?? '/');
}`;
}

// 41. Custom RouterLinkActive class strategy
@Component({
  selector: 'ex-41', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">routerLinkActive can apply multiple classes and be customized.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <div style="display:flex;gap:8px;margin-top:6px">
      @for (item of items; track item.label) {
        <span (click)="active.set(item.path)"
              [class]="active() === item.path ? 'nav-link active font-bold text-primary' : 'nav-link'"
              style="padding:4px 10px;cursor:pointer;border-radius:4px"
              [style.background]="active() === item.path ? '#e8f0fe' : '#f4f4f4'"
              [style.fontWeight]="active() === item.path ? 'bold' : 'normal'">
          {{ item.label }}
        </span>
      }
    </div>
  `
})
class Ex41 {
  active = signal('/home');
  items = [{ path: '/home', label: 'Home' }, { path: '/about', label: 'About' }, { path: '/docs', label: 'Docs' }];
  code = `<a routerLink="/home" routerLinkActive="active font-bold text-primary"
   [routerLinkActiveOptions]="{exact:true}">Home</a>`;
}

// 42. Router preloading demo (PreloadAllModules)
@Component({
  selector: 'ex-42', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Preloading strategies load lazy routes in the background after initial load.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <table style="font-size:11px;border-collapse:collapse;width:100%">
      @for (s of strategies; track s.name) {
        <tr style="border-bottom:1px solid #eee">
          <td style="padding:4px;font-weight:bold">{{ s.name }}</td>
          <td style="padding:4px">{{ s.desc }}</td>
        </tr>
      }
    </table>
  `
})
class Ex42 {
  code = `provideRouter(routes, withPreloading(PreloadAllModules))`;
  strategies = [
    { name: 'NoPreloading', desc: 'Default — load lazily on demand' },
    { name: 'PreloadAllModules', desc: 'Preload all lazy routes after initial load' },
    { name: 'Custom strategy', desc: 'Implement PreloadingStrategy to selective preload' },
  ];
}

// 43. Router scroll behavior
@Component({
  selector: 'ex-43', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">withInMemoryScrolling configures scroll restoration on navigation.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <p style="font-size:12px">scrollPositionRestoration: 'enabled' — restores scroll on back navigation.</p>
  `
})
class Ex43 {
  code = `provideRouter(routes,
  withInMemoryScrolling({
    scrollPositionRestoration: 'enabled',
    anchorScrolling: 'enabled'
  })
)`;
}

// 44. withViewTransitions
@Component({
  selector: 'ex-44', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">withViewTransitions() enables the View Transitions API for route changes (Angular 17+).</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <p style="font-size:12px">Use CSS ::view-transition-* pseudo-elements for custom animations.</p>
  `
})
class Ex44 {
  code = `provideRouter(routes, withViewTransitions())

// Optional callback:
provideRouter(routes, withViewTransitions({
  onViewTransitionCreated: ({ transition }) => {
    transition.skipTransition(); // conditionally skip
  }
}))`;
}

// 45. Custom reuse strategy concept
@Component({
  selector: 'ex-45', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">RouteReuseStrategy allows caching and reusing component instances across navigations.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
  `
})
class Ex45 {
  code = `class CustomReuseStrategy implements RouteReuseStrategy {
  private cache = new Map<string, DetachedRouteHandle>();
  shouldDetach(route: ActivatedRouteSnapshot) {
    return route.data['reuse'] === true;
  }
  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle) {
    this.cache.set(route.routeConfig?.path ?? '', handle);
  }
  shouldAttach(route: ActivatedRouteSnapshot) {
    return this.cache.has(route.routeConfig?.path ?? '');
  }
  retrieve(route: ActivatedRouteSnapshot) {
    return this.cache.get(route.routeConfig?.path ?? '') ?? null;
  }
  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot) {
    return future.routeConfig === curr.routeConfig;
  }
}`;
}

// 46. router.lastSuccessfulNavigation
@Component({
  selector: 'ex-46', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">router.lastSuccessfulNavigation returns the last completed Navigation object.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <button (click)="check()">Check last navigation</button>
    <p style="font-size:12px">{{ result() }}</p>
  `
})
class Ex46 {
  result = signal('');
  code = `const nav = inject(Router).lastSuccessfulNavigation;
// nav.id — navigation id
// nav.initialUrl — URL before guards
// nav.finalUrl — URL after redirects
// nav.trigger — 'imperative' | 'popstate' | 'hashchange'
// nav.extras — NavigationExtras used`;
  check() { this.result.set('lastSuccessfulNavigation: { id: 1, trigger: "imperative", finalUrl: "/home" } (simulated)'); }
}

// 47. Initial navigation config
@Component({
  selector: 'ex-47', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">initialNavigation controls when the first navigation happens (important for SSR).</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <table style="font-size:11px;border-collapse:collapse;width:100%">
      @for (opt of opts; track opt.val) {
        <tr style="border-bottom:1px solid #eee">
          <td style="padding:4px;font-weight:bold">{{ opt.val }}</td>
          <td style="padding:4px">{{ opt.desc }}</td>
        </tr>
      }
    </table>
  `
})
class Ex47 {
  code = `provideRouter(routes, withEnabledBlockingInitialNavigation())
provideRouter(routes, withDisabledInitialNavigation())`;
  opts = [
    { val: 'enabledBlocking', desc: 'Blocks app init until first navigation completes (SSR)' },
    { val: 'enabledNonBlocking', desc: 'Default — navigation starts after bootstrap' },
    { val: 'disabled', desc: 'No initial navigation — app must call router.initialNavigation()' },
  ];
}

// 48. withDebugTracing
@Component({
  selector: 'ex-48', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">withDebugTracing() logs all router events to the console — useful during development.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
    <p style="font-size:12px">Only enable in development — logs verbose output for every NavigationStart, GuardsCheck, Resolve, etc.</p>
  `
})
class Ex48 {
  code = `// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withDebugTracing() // remove in production!
    )
  ]
};`;
}

// 49. Router with SSR considerations
@Component({
  selector: 'ex-49', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">SSR requires withEnabledBlockingInitialNavigation() so the server renders the correct route.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px">{{ code }}</pre>
  `
})
class Ex49 {
  code = `// app.config.server.ts (SSR config)
export const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideRouter(
      routes,
      withEnabledBlockingInitialNavigation()
    )
  ]
};`;
}

// 50. Full SPA navigation pattern
@Component({
  selector: 'ex-50', standalone: true,
  template: `
    <p style="font-size:12px;color:#555">Complete SPA routing setup combining multiple withX features.</p>
    <pre style="font-size:11px;background:#f4f4f4;padding:8px;border-radius:4px;overflow:auto">{{ code }}</pre>
    <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
      @for (feat of features; track feat) {
        <span style="padding:2px 8px;background:#e8f0fe;border-radius:10px;font-size:11px;color:royalblue">{{ feat }}</span>
      }
    </div>
  `
})
class Ex50 {
  features = ['provideRouter', 'withComponentInputBinding', 'withPreloading', 'withViewTransitions', 'withInMemoryScrolling', 'withDebugTracing'];
  code = `export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      appRoutes,
      withComponentInputBinding(),
      withPreloading(PreloadAllModules),
      withViewTransitions(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled'
      }),
      // withDebugTracing() // dev only
    )
  ]
};`;
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
      <h1>Examples 4.1 — Router Basics</h1>
      <h4>1. RouterLink usage demo</h4><ex-01 /><hr />
      <h4>2. RouterLinkActive demo</h4><ex-02 /><hr />
      <h4>3. router-outlet placeholder</h4><ex-03 /><hr />
      <h4>4. provideRouter config</h4><ex-04 /><hr />
      <h4>5. navigate() programmatic</h4><ex-05 /><hr />
      <h4>6. navigateByUrl()</h4><ex-06 /><hr />
      <h4>7. Router events overview</h4><ex-07 /><hr />
      <h4>8. isActive check</h4><ex-08 /><hr />
      <h4>9. href vs routerLink difference</h4><ex-09 /><hr />
      <h4>10. routerLink with string</h4><ex-10 /><hr />
      <h4>11. routerLink with array</h4><ex-11 /><hr />
      <h4>12. routerLink relative navigation</h4><ex-12 /><hr />
      <h4>13. routerLink with fragment</h4><ex-13 /><hr />
      <h4>14. routerLinkActiveOptions exact</h4><ex-14 /><hr />
      <h4>15. RouterLinkActive on parent element</h4><ex-15 /><hr />
      <h4>16. Router.navigate with NavigationExtras</h4><ex-16 /><hr />
      <h4>17. NavigationExtras queryParams</h4><ex-17 /><hr />
      <h4>18. NavigationExtras fragment</h4><ex-18 /><hr />
      <h4>19. skipLocationChange extra</h4><ex-19 /><hr />
      <h4>20. replaceUrl extra</h4><ex-20 /><hr />
      <h4>21. Router events tap (loading indicator)</h4><ex-21 /><hr />
      <h4>22. NavigationStart/End/Cancel events</h4><ex-22 /><hr />
      <h4>23. router.url (current URL)</h4><ex-23 /><hr />
      <h4>24. router.events Observable</h4><ex-24 /><hr />
      <h4>25. router.navigateByUrl vs navigate</h4><ex-25 /><hr />
      <h4>26. withHashLocation strategy</h4><ex-26 /><hr />
      <h4>27. Full nav component with RouterLink</h4><ex-27 /><hr />
      <h4>28. Breadcrumb with Router</h4><ex-28 /><hr />
      <h4>29. Side menu with RouterLinkActive</h4><ex-29 /><hr />
      <h4>30. Tab component with router-based selection</h4><ex-30 /><hr />
      <h4>31. Navigation guard integration demo</h4><ex-31 /><hr />
      <h4>32. Router events loading indicator</h4><ex-32 /><hr />
      <h4>33. Deep nested navigation demo</h4><ex-33 /><hr />
      <h4>34. Multi-level menu with RouterLink</h4><ex-34 /><hr />
      <h4>35. Footer with router links</h4><ex-35 /><hr />
      <h4>36. Programmatic navigation from service</h4><ex-36 /><hr />
      <h4>37. Auth-aware nav links</h4><ex-37 /><hr />
      <h4>38. Route change animation trigger</h4><ex-38 /><hr />
      <h4>39. withComponentInputBinding</h4><ex-39 /><hr />
      <h4>40. toSignal(router.events)</h4><ex-40 /><hr />
      <h4>41. Custom RouterLinkActive class strategy</h4><ex-41 /><hr />
      <h4>42. Router preloading demo</h4><ex-42 /><hr />
      <h4>43. Router scroll behavior</h4><ex-43 /><hr />
      <h4>44. withViewTransitions</h4><ex-44 /><hr />
      <h4>45. Custom reuse strategy concept</h4><ex-45 /><hr />
      <h4>46. router.lastSuccessfulNavigation</h4><ex-46 /><hr />
      <h4>47. Initial navigation config</h4><ex-47 /><hr />
      <h4>48. withDebugTracing</h4><ex-48 /><hr />
      <h4>49. Router with SSR considerations</h4><ex-49 /><hr />
      <h4>50. Full SPA navigation pattern</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
