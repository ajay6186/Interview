import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

// ============================================================
// Exercise 6.5 — Nested Routes
// ============================================================
// Topics:
//   • children routes in route config
//   • Nested <router-outlet>
//   • Relative navigation (../sibling, ./child)
//   • Tabbed interfaces with child routes
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: ProductsShellComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-products-shell'.
// It serves as the outer shell for the products feature.
// Import RouterOutlet.
// Template: <h2>Products</h2> + <router-outlet>
//
// @Component({ selector: 'app-products-shell', standalone: true, imports: [RouterOutlet], ... })
// export class ProductsShellComponent { ... }

// ---------------------------------------------------------------------------
// TODO 2: ProductListComponent + ProductDetailComponent
// ---------------------------------------------------------------------------
// Create ProductListComponent with selector 'app-product-list':
//   - Display a list of products with RouterLink to /products/:id
// Create ProductDetailComponent with selector 'app-product-detail':
//   - Inject ActivatedRoute, read :id param, display product detail
//
// Route config:
//   { path: 'products', component: ProductsShellComponent, children: [
//     { path: '', component: ProductListComponent },
//     { path: ':id', component: ProductDetailComponent },
//   ]}

// ---------------------------------------------------------------------------
// TODO 3: SettingsComponent with children
// ---------------------------------------------------------------------------
// Create SettingsComponent as a shell with router-outlet.
// Create SettingsProfileComponent (for /settings/profile).
// Create SettingsSecurityComponent (for /settings/security).
// Add a nav inside SettingsComponent to navigate between the children.
//
// Route config:
//   { path: 'settings', component: SettingsComponent, children: [
//     { path: '', redirectTo: 'profile', pathMatch: 'full' },
//     { path: 'profile', component: SettingsProfileComponent },
//     { path: 'security', component: SettingsSecurityComponent },
//   ]}

// ---------------------------------------------------------------------------
// TODO 4: TabsComponent
// ---------------------------------------------------------------------------
// Create a TabsComponent that uses child routes as tabs.
// Three tabs: Overview, Reviews, Specs — each a child route.
// The active tab should highlight (use RouterLinkActive).
// Display the tab content via <router-outlet>.
//
// @Component({ selector: 'app-tabs', standalone: true, imports: [RouterOutlet, RouterLink, RouterLinkActive], ... })
// export class TabsComponent { ... }

// ---------------------------------------------------------------------------
// TODO 5: RelativeNavComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-relative-nav'.
// Inject Router and ActivatedRoute.
// Demonstrate relative navigation:
//   - router.navigate(['../sibling'], { relativeTo: this.route })
//   - router.navigate(['./child'], { relativeTo: this.route })
// Show the current URL and buttons for relative navigation.
//
// @Component({ selector: 'app-relative-nav', standalone: true, ... })
// export class RelativeNavComponent { ... }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 6.5 — Nested Routes</h1>
      <!-- TODO: render shell components -->
      <router-outlet />
    </div>
  `,
})
export class AppComponent {}
