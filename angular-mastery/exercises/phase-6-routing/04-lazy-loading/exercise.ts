import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

// ============================================================
// Exercise 6.4 — Lazy Loading
// ============================================================
// Topics:
//   • loadComponent — lazy load a single component
//   • loadChildren — lazy load a feature routes array
//   • Preloading strategies
//   • Code splitting benefits
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: Lazy Dashboard (loadComponent)
// ---------------------------------------------------------------------------
// Demonstrate the loadComponent pattern for lazy loading.
// Create a DashboardComponent that would be loaded lazily.
// Show how to configure the route:
//   { path: 'dashboard', loadComponent: () => import('./dashboard').then(m => m.DashboardComponent) }
//
// export class DashboardComponent { ... }

// ---------------------------------------------------------------------------
// TODO 2: Lazy Feature Routes (loadChildren)
// ---------------------------------------------------------------------------
// Demonstrate the loadChildren pattern.
// Create a FEATURE_ROUTES array that would be in a separate file.
// Show how to configure the parent route:
//   { path: 'admin', loadChildren: () => import('./admin.routes').then(r => r.ADMIN_ROUTES) }
//
// export const FEATURE_ROUTES = [...]

// ---------------------------------------------------------------------------
// TODO 3: DashboardComponent
// ---------------------------------------------------------------------------
// Create an actual DashboardComponent for the lazy loading demo.
// selector: 'app-dashboard'
// Display: "Dashboard — Loaded Lazily!"
// Show a timestamp when the component was first loaded.
//
// @Component({ selector: 'app-dashboard', standalone: true, ... })
// export class DashboardComponent { ... }

// ---------------------------------------------------------------------------
// TODO 4: AdminRoutes (lazy feature)
// ---------------------------------------------------------------------------
// Create AdminHomeComponent and AdminSettingsComponent.
// Create ADMIN_ROUTES with:
//   { path: '', component: AdminHomeComponent }
//   { path: 'settings', component: AdminSettingsComponent }
// Show how a <router-outlet> inside AdminHomeComponent enables child routing.
//
// export const ADMIN_ROUTES = [...]

// ---------------------------------------------------------------------------
// TODO 5: PreloadingStrategy display
// ---------------------------------------------------------------------------
// Create a component with selector 'app-preloading-demo'.
// Show how to configure PreloadAllModules vs NoPreloading:
//   provideRouter(routes, withPreloading(PreloadAllModules))
//   provideRouter(routes, withPreloading(NoPreloading))
// Display explanatory text about each strategy.
//
// @Component({ selector: 'app-preloading-demo', standalone: true, ... })
// export class PreloadingDemoComponent { ... }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 6.4 — Lazy Loading</h1>
      <!-- TODO: render components and show route config examples -->
    </div>
  `,
})
export class AppComponent {}
