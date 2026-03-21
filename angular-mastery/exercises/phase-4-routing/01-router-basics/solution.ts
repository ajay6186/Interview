// Phase 4 - Solution 01: Router Basics
// Topics: provideRouter, Routes, RouterOutlet, RouterLink, RouterLinkActive,
//         ActivatedRoute (params), programmatic navigation with Router.navigate()
//
// NOTE: In a real Angular app you would wire up routes in main.ts like:
//   bootstrapApplication(AppComponent, {
//     providers: [ provideRouter(routes) ]
//   });
//
// Since this is a single-file demo we simulate routing with a local `currentView`
// signal so all patterns are visible and the file compiles cleanly.

import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// ─── Simulated router utilities (single-file shim) ──────────────────────────
// In a real app these come from '@angular/router'
type RouteSegment = string | number;
type RouteParams = Record<string, string>;

class SimulatedActivatedRoute {
  params: RouteParams = {};
}

class SimulatedRouter {
  private _view = signal<string>('home');
  private _params: RouteParams = {};

  get currentView() { return this._view(); }

  navigate(segments: RouteSegment[], _extras?: object): void {
    const path = segments.join('/');
    if (path.startsWith('/products/')) {
      this._params = { id: String(segments[segments.length - 1]) };
      this._view.set('product-detail');
    } else if (path === '/products' || path === 'products') {
      this._params = {};
      this._view.set('products');
    } else if (path === '/about' || path === 'about') {
      this._view.set('about');
    } else {
      this._view.set('home');
    }
  }

  getParams(): RouteParams { return this._params; }
  getViewSignal() { return this._view; }
}

// Shared singleton for this demo
const router = new SimulatedRouter();

// ─────────────────────────────────────────────────────────────────────────────
// Route configuration (would be registered with provideRouter in main.ts)
// ─────────────────────────────────────────────────────────────────────────────
/*
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '',             component: HomeComponent },
  { path: 'about',        component: AboutComponent },
  { path: 'products',     component: ProductListComponent },
  { path: 'products/:id', component: ProductDetailComponent },
  { path: '**',           component: NotFoundComponent },
];
*/

// ─────────────────────────────────────────────────────────────────────────────
// 1. Simple page components
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <div style="padding:1rem; background:#e8f5e9; border-radius:8px">
      <h2>Welcome Home</h2>
      <p>This is the home page. Navigate using the navbar above.</p>
    </div>
  `,
})
export class HomeComponent {}

@Component({
  selector: 'app-about',
  standalone: true,
  template: `
    <div style="padding:1rem; background:#e3f2fd; border-radius:8px">
      <h2>About Us</h2>
      <p>We are a demo Angular routing application showcasing Angular 17 router features.</p>
    </div>
  `,
})
export class AboutComponent {}

@Component({
  selector: 'app-not-found',
  standalone: true,
  template: `
    <div style="padding:1rem; background:#fce4ec; border-radius:8px">
      <h2>404 – Page Not Found</h2>
      <p>The route you requested does not exist.</p>
      <button (click)="goHome()">Go Home</button>
    </div>
  `,
})
export class NotFoundComponent {
  goHome() { router.navigate(['/']); }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ProductListComponent — links to /products/:id
// ─────────────────────────────────────────────────────────────────────────────

interface Product { id: number; name: string; }

@Component({
  selector: 'app-product-list',
  standalone: true,
  template: `
    <div style="padding:1rem; background:#fff8e1; border-radius:8px">
      <h2>Products</h2>
      <!--
        Real app: <a [routerLink]="['/products', p.id]" routerLinkActive="active">
        Simulated: click handler navigates programmatically
      -->
      <ul>
        @for (p of products; track p.id) {
          <li>
            <a href="#" (click)="$event.preventDefault(); navigate(p.id)">
              {{ p.name }}
            </a>
          </li>
        }
      </ul>
    </div>
  `,
})
export class ProductListComponent {
  products: Product[] = [
    { id: 1, name: 'Angular Book' },
    { id: 2, name: 'TypeScript Course' },
    { id: 3, name: 'RxJS Workshop' },
  ];

  navigate(id: number) {
    // Real: router.navigate(['/products', id])
    router.navigate(['/products', id]);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ProductDetailComponent — reads :id from ActivatedRoute params
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-product-detail',
  standalone: true,
  template: `
    <div style="padding:1rem; background:#f3e5f5; border-radius:8px">
      <h2>Product Detail</h2>
      <p><strong>Product ID:</strong> {{ productId() }}</p>
      <!--
        REAL PATTERN (with actual ActivatedRoute):

        // snapshot (one-time read — fine when param never changes while on page)
        this.productId.set(this.route.snapshot.paramMap.get('id') ?? '');

        // Observable (re-reads if same component is reused with new params)
        this.route.params.subscribe(params => {
          this.productId.set(params['id']);
        });
      -->
      <p style="font-style:italic; color:#666">
        (Real app uses inject(ActivatedRoute).params Observable — see comment above)
      </p>
      <button (click)="goBack()">← Back to Products</button>
    </div>
  `,
})
export class ProductDetailComponent implements OnInit {
  productId = signal<string>('');

  ngOnInit() {
    // Simulated: read from our shim router
    const params = router.getParams();
    this.productId.set(params['id'] ?? 'unknown');

    /*
    // REAL ANGULAR PATTERN:
    const route = inject(ActivatedRoute);
    const router = inject(Router);

    // Snapshot (works once):
    this.productId.set(route.snapshot.paramMap.get('id') ?? '');

    // Observable (handles param-to-param navigation on same route):
    route.params.subscribe(p => this.productId.set(p['id']));

    // Or with takeUntilDestroyed():
    route.params
      .pipe(takeUntilDestroyed())
      .subscribe(p => this.productId.set(p['id']));
    */
  }

  goBack() {
    router.navigate(['/products']);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. NavbarComponent — RouterLink + RouterLinkActive styling
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-navbar',
  standalone: true,
  template: `
    <nav style="display:flex; gap:1rem; padding:0.75rem; background:#1a237e; border-radius:8px; margin-bottom:1rem">
      <!--
        REAL PATTERN:
        <a routerLink="/"         routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Home</a>
        <a routerLink="/products" routerLinkActive="active">Products</a>
        <a routerLink="/about"    routerLinkActive="active">About</a>

        routerLinkActive adds 'active' CSS class when the route matches.
        exact: true ensures '/' only matches the root, not every route.
      -->
      @for (link of links; track link.path) {
        <a
          href="#"
          (click)="$event.preventDefault(); navigate(link.path)"
          [style.color]="isActive(link.path) ? '#ffeb3b' : 'white'"
          [style.font-weight]="isActive(link.path) ? 'bold' : 'normal'"
          [style.text-decoration]="'none'"
        >
          {{ link.label }}
        </a>
      }
    </nav>
  `,
})
export class NavbarComponent {
  links = [
    { path: 'home',     label: 'Home'     },
    { path: 'products', label: 'Products' },
    { path: 'about',    label: 'About'    },
  ];

  currentView = router.getViewSignal();

  navigate(path: string) { router.navigate([path === 'home' ? '/' : path]); }

  isActive(path: string): boolean {
    const view = this.currentView();
    if (path === 'home') return view === 'home';
    return view.startsWith(path);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. BreadcrumbComponent — reads current URL segments
// ─────────────────────────────────────────────────────────────────────────────

interface Breadcrumb { label: string; path: string; }

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  template: `
    <nav style="padding:0.4rem 0; margin-bottom:0.5rem; font-size:0.9rem; color:#555">
      <!--
        REAL PATTERN:
        constructor() {
          this.router.events
            .pipe(filter(e => e instanceof NavigationEnd))
            .subscribe(() => this.buildBreadcrumbs());
        }

        private buildBreadcrumbs() {
          let route = this.activatedRoute.root;
          const crumbs: Breadcrumb[] = [{ label: 'Home', path: '/' }];
          while (route.firstChild) {
            route = route.firstChild;
            if (route.snapshot.url.length) {
              crumbs.push({
                label: route.snapshot.url.map(s => s.path).join('/'),
                path: '/' + crumbs.map(c => c.label).join('/'),
              });
            }
          }
          this.breadcrumbs.set(crumbs);
        }
      -->
      @for (crumb of breadcrumbs(); track crumb.path; let last = $last) {
        @if (!last) {
          <a href="#" (click)="$event.preventDefault(); navigate(crumb.path)"
             style="color:#1a237e; text-decoration:none">
            {{ crumb.label }}
          </a>
          <span style="margin:0 0.4rem">›</span>
        } @else {
          <span>{{ crumb.label }}</span>
        }
      }
    </nav>
  `,
})
export class BreadcrumbComponent implements OnInit {
  breadcrumbs = signal<Breadcrumb[]>([]);
  private currentView = router.getViewSignal();

  ngOnInit() { this.buildBreadcrumbs(); }

  buildBreadcrumbs() {
    const view = this.currentView();
    const crumbs: Breadcrumb[] = [{ label: 'Home', path: '/' }];
    if (view === 'products') {
      crumbs.push({ label: 'Products', path: '/products' });
    } else if (view === 'product-detail') {
      crumbs.push({ label: 'Products', path: '/products' });
      crumbs.push({ label: `Product ${router.getParams()['id']}`, path: `/products/${router.getParams()['id']}` });
    } else if (view === 'about') {
      crumbs.push({ label: 'About', path: '/about' });
    }
    this.breadcrumbs.set(crumbs);
  }

  navigate(path: string) { router.navigate([path]); }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT — wires everything together
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    BreadcrumbComponent,
    HomeComponent,
    AboutComponent,
    NotFoundComponent,
    ProductListComponent,
    ProductDetailComponent,
  ],
  template: `
    <div style="font-family:sans-serif; max-width:800px; margin:2rem auto; padding:0 1rem">
      <h1>Phase 4 – Router Basics (Single-File Demo)</h1>

      <app-navbar (click)="refresh()" />
      <app-breadcrumb />

      <!-- router-outlet equivalent: switch on current view -->
      @switch (currentView()) {
        @case ('home')           { <app-home /> }
        @case ('about')          { <app-about /> }
        @case ('products')       { <app-product-list /> }
        @case ('product-detail') { <app-product-detail /> }
        @default                 { <app-not-found /> }
      }

      <div style="margin-top:2rem; padding:1rem; background:#f5f5f5; border-radius:8px; font-size:0.85rem">
        <strong>Key Patterns (Real Angular):</strong>
        <ul>
          <li>Register routes: <code>provideRouter(routes)</code> in main.ts providers</li>
          <li>Render outlet: <code>&lt;router-outlet /&gt;</code> in root template</li>
          <li>Navigate in template: <code>[routerLink]="['/products', id]"</code></li>
          <li>Active class: <code>routerLinkActive="active"</code></li>
          <li>Read params: <code>inject(ActivatedRoute).params</code> Observable</li>
          <li>Navigate in code: <code>inject(Router).navigate(['/path', param])</code></li>
        </ul>
      </div>
    </div>
  `,
})
export class AppComponent {
  currentView = router.getViewSignal();
  // Trigger change detection when navbar is clicked
  refresh() { /* signals handle reactivity automatically */ }
}
