import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

// ============================================================
// Exercise 6.1 — Router Basics
// ============================================================
// Topics:
//   • provideRouter (configured in main.ts)
//   • RouterOutlet, RouterLink, RouterLinkActive
//   • Programmatic navigation with inject(Router)
//   • Route configuration array
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: NavComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-nav'.
// Import RouterLink and RouterLinkActive.
// Render navigation links to /home, /about, /contact.
// Use routerLinkActive="active" and add a style for .active { font-weight: bold }.
//
// @Component({ selector: 'app-nav', standalone: true, imports: [RouterLink, RouterLinkActive], ... })
// export class NavComponent { ... }

// ---------------------------------------------------------------------------
// TODO 2: Page Components
// ---------------------------------------------------------------------------
// Create three simple page components:
//   - HomeComponent (selector: 'app-home') — displays "Welcome Home!"
//   - AboutComponent (selector: 'app-about') — displays "About Us"
//   - ContactComponent (selector: 'app-contact') — displays "Contact Us"
// All standalone.
//
// @Component({ selector: 'app-home', standalone: true, template: `<h2>Welcome Home!</h2>` })
// export class HomeComponent {}
// ... (AboutComponent, ContactComponent)

// ---------------------------------------------------------------------------
// TODO 3: RouterOutletComponent (Shell)
// ---------------------------------------------------------------------------
// Create a component with selector 'app-shell'.
// Import NavComponent and RouterOutlet.
// Template: show NavComponent at top, then <router-outlet> below it.
//
// @Component({ selector: 'app-shell', standalone: true, imports: [NavComponent, RouterOutlet], ... })
// export class ShellComponent { ... }

// ---------------------------------------------------------------------------
// TODO 4: ProgrammaticNavComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-programmatic-nav'.
// Inject Router using inject(Router).
// Add buttons: "Go Home", "Go About", "Go Contact".
// Each button calls router.navigate(['/path']).
//
// @Component({ selector: 'app-programmatic-nav', standalone: true, ... })
// export class ProgrammaticNavComponent { ... }

// ---------------------------------------------------------------------------
// TODO 5: AppComponent (Root with routes)
// ---------------------------------------------------------------------------
// Configure the routes in AppComponent (they will be passed to provideRouter in main.ts).
// Export routes as: export const APP_ROUTES: Routes = [...]
// The AppComponent template should show the shell.
// Include redirect: { path: '', redirectTo: 'home', pathMatch: 'full' }
//
// export const APP_ROUTES: Routes = [...]

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 6.1 — Router Basics</h1>
      <!-- TODO: render ShellComponent (which contains nav + router-outlet) -->
      <router-outlet />
    </div>
  `,
})
export class AppComponent {}
