// Phase 4 - Exercise 01: Router Basics
// Topics: provideRouter, Routes, RouterOutlet, RouterLink, RouterLinkActive,
//         ActivatedRoute (params), programmatic navigation with Router.navigate()
//
// Run: include provideRouter(routes) in your main.ts bootstrapApplication call
// Docs: https://angular.dev/guide/routing

import { Component } from '@angular/core';

// ─────────────────────────────────────────────
// TODO 1: Create HomeComponent, AboutComponent, NotFoundComponent
//
// Each should be a standalone component with a simple inline template.
// HomeComponent  → selector: 'app-home',  template shows "Welcome Home"
// AboutComponent → selector: 'app-about', template shows "About Us"
// NotFoundComponent → selector: 'app-not-found', template shows "404 – Page Not Found"
// ─────────────────────────────────────────────

// TODO 1a: HomeComponent
// @Component({ ... })
// export class HomeComponent { }

// TODO 1b: AboutComponent
// @Component({ ... })
// export class AboutComponent { }

// TODO 1c: NotFoundComponent
// @Component({ ... })
// export class NotFoundComponent { }

// ─────────────────────────────────────────────
// TODO 2: Create ProductListComponent
//
// - selector: 'app-product-list'
// - It should display a hardcoded list of 3 products (id + name)
// - Each product name should be a RouterLink to /products/:id
//   e.g. <a [routerLink]="['/products', product.id]">{{ product.name }}</a>
// ─────────────────────────────────────────────

// TODO 2: ProductListComponent
// @Component({ ... })
// export class ProductListComponent { }

// ─────────────────────────────────────────────
// TODO 3: Create ProductDetailComponent
//
// - selector: 'app-product-detail'
// - Inject ActivatedRoute using inject(ActivatedRoute)
// - Read the :id route param from route.snapshot.paramMap.get('id')
//   AND subscribe to route.params observable to react to param changes
// - Display "Product ID: <id>" in the template
// - Add a "Go Back" button that calls Router.navigate(['/products'])
// ─────────────────────────────────────────────

// TODO 3: ProductDetailComponent
// @Component({ ... })
// export class ProductDetailComponent { }

// ─────────────────────────────────────────────
// TODO 4: Create NavbarComponent
//
// - selector: 'app-navbar'
// - Use RouterLink for navigation links: Home (/), Products (/products), About (/about)
// - Use RouterLinkActive to add a CSS class 'active' to the current link
//   e.g. routerLinkActiveOptions: { exact: true } for the home link
// - Style active links differently (inline style or ngClass is fine)
// ─────────────────────────────────────────────

// TODO 4: NavbarComponent
// @Component({ ... })
// export class NavbarComponent { }

// ─────────────────────────────────────────────
// TODO 5: Create BreadcrumbComponent
//
// - selector: 'app-breadcrumb'
// - Inject Router and ActivatedRoute
// - Listen to router.events filtered to NavigationEnd
// - Build breadcrumbs array from the activated route snapshot tree
//   (walk route.root → route.firstChild → ... collecting route.url segments)
// - Display breadcrumbs as: Home > Products > 42
// ─────────────────────────────────────────────

// TODO 5: BreadcrumbComponent
// @Component({ ... })
// export class BreadcrumbComponent { }

// ─────────────────────────────────────────────
// TODO 6: Add all components to imports[] and render them in AppComponent
//
// Also define a Routes array (for reference — actual registration happens in main.ts):
//
// export const routes: Routes = [
//   { path: '',          component: HomeComponent },
//   { path: 'about',     component: AboutComponent },
//   { path: 'products',  component: ProductListComponent },
//   { path: 'products/:id', component: ProductDetailComponent },
//   { path: '**',        component: NotFoundComponent },
// ];
//
// In AppComponent template, render:
//   <app-navbar />
//   <app-breadcrumb />
//   <router-outlet />
// ─────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO 6: import RouterOutlet, RouterLink, RouterLinkActive from '@angular/router'
    // TODO 6: import all components above
  ],
  template: `
    <h1>Router Basics Exercise</h1>
    <!-- TODO 6: render NavbarComponent, BreadcrumbComponent, and RouterOutlet here -->
  `,
})
export class AppComponent {}
