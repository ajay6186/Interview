import { Component } from '@angular/core';

// ============================================================
// Exercise 8.5 — Theme Service
// ============================================================
// Topics:
//   • Signal-based theme state persisted to localStorage
//   • Components that react to theme changes
//   • OS dark mode detection via window.matchMedia
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: ThemeService
// ---------------------------------------------------------------------------
// Create a ThemeService decorated with @Injectable({ providedIn: 'root' }).
// Signal: theme: 'light' | 'dark' — persisted to localStorage.
// On construction, read from localStorage. If not set, detect OS preference.
// Method: toggle() — switches between 'light' and 'dark'.
// Use effect() to persist theme changes to localStorage and update
// document.documentElement's class.
//
// @Injectable({ providedIn: 'root' })
// export class ThemeService { ... }

// ---------------------------------------------------------------------------
// TODO 2: ThemeToggleComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-theme-toggle'.
// Inject ThemeService.
// Display a button that shows "🌙 Dark" or "☀️ Light" based on current theme.
// Call themeService.toggle() on click.
//
// @Component({ selector: 'app-theme-toggle', standalone: true, ... })
// export class ThemeToggleComponent { ... }

// ---------------------------------------------------------------------------
// TODO 3: ThemedCardComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-themed-card'.
// Inject ThemeService.
// Apply dynamic styles based on the current theme:
//   - light: white background, dark text
//   - dark: dark background (#1a1a2e), light text
// Display some content (title + body text).
//
// @Component({ selector: 'app-themed-card', standalone: true, ... })
// export class ThemedCardComponent { ... }

// ---------------------------------------------------------------------------
// TODO 4: ThemeProviderComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-theme-provider'.
// Inject ThemeService.
// This component wraps its content with a <div> that applies theme classes.
// Use [class.dark]="themeService.theme() === 'dark'".
// Demonstrate passing theme context to child components via DI.
//
// @Component({ selector: 'app-theme-provider', standalone: true, ... })
// export class ThemeProviderComponent { ... }

// ---------------------------------------------------------------------------
// TODO 5: PrefersDarkComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-prefers-dark'.
// Use window.matchMedia('(prefers-color-scheme: dark)') to detect OS preference.
// Listen for changes with .addEventListener('change', ...).
// Display the detected preference.
// Clean up the listener on destroy.
//
// @Component({ selector: 'app-prefers-dark', standalone: true, ... })
// export class PrefersDarkComponent { ... }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO: Add all exercise components
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 8.5 — Theme Service</h1>
      <!-- TODO: render all components -->
    </div>
  `,
})
export class AppComponent {}
