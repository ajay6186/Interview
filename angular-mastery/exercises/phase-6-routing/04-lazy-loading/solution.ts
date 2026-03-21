import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

// ============================================================
// Solution 6.4 — Lazy Loading
// ============================================================

// SOLUTION 3: DashboardComponent (would be lazy loaded)
@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="background:#e8f5e9;padding:16px;border-radius:8px;">
      <h3>Dashboard — Loaded Lazily!</h3>
      <p>First loaded at: {{ loadedAt }}</p>
    </div>
  `,
})
class DashboardComponent {
  loadedAt = new Date().toLocaleTimeString();
}

// SOLUTION 4: Admin components
@Component({ selector: 'app-admin-home', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink],
  template: `
    <h3>Admin Home</h3>
    <a routerLink="settings">Settings</a>
    <router-outlet />
  ` })
class AdminHomeComponent {}

@Component({ selector: 'app-admin-settings', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h4>Admin Settings</h4>` })
class AdminSettingsComponent {}

// Admin routes (in real app this would be in admin.routes.ts)
export const ADMIN_ROUTES = [
  { path: '',         component: AdminHomeComponent },
  { path: 'settings', component: AdminSettingsComponent },
];

// SOLUTION 5: Preloading demo
@Component({
  selector: 'app-preloading-demo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Preloading Strategies</h3>
      <p><strong>PreloadAllModules:</strong> Eagerly preloads all lazy modules after initial load.</p>
      <pre style="background:#f4f4f4;padding:8px;border-radius:4px;font-size:12px;">
provideRouter(routes, withPreloading(PreloadAllModules))</pre>
      <p><strong>NoPreloading (default):</strong> Only loads when navigated to.</p>
      <pre style="background:#f4f4f4;padding:8px;border-radius:4px;font-size:12px;">
provideRouter(routes)  // no preloading</pre>
    </section>
  `,
})
class PreloadingDemoComponent {}

// Route config (documentation in code)
const ROUTE_CONFIG_EXAMPLE = `
// In main.ts or app.routes.ts:
export const APP_ROUTES = [
  // loadComponent — lazy single component
  {
    path: 'dashboard',
    loadComponent: () => import('./exercises/phase-6-routing/04-lazy-loading/solution')
      .then(m => m.DashboardComponent)
  },
  // loadChildren — lazy feature routes
  {
    path: 'admin',
    loadChildren: () => import('./exercises/phase-6-routing/04-lazy-loading/solution')
      .then(m => m.ADMIN_ROUTES)
  },
];
`;

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DashboardComponent, AdminHomeComponent, PreloadingDemoComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 6.4 — Lazy Loading</h1>
      <p><em>In production, DashboardComponent would only load when /dashboard is visited.</em></p>
      <app-dashboard />
      <hr />
      <app-admin-home />
      <hr />
      <app-preloading-demo />
    </div>
  `,
})
export class AppComponent {}
