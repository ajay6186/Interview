import { Component, inject } from '@angular/core';

// ============================================================
// Exercise 3.2 — Services & Dependency Injection
// ============================================================
// Topics:
//   • @Injectable / providedIn: 'root'
//   • inject() function
//   • Signals in services
//   • Injection tokens
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: LoggerService
// ---------------------------------------------------------------------------
// Create a LoggerService decorated with @Injectable({ providedIn: 'root' }).
// It should maintain a `logs` signal (array of strings).
// Method: log(msg: string) — appends msg with a timestamp to the logs signal.
// Method: clear() — resets logs to [].
//
// @Injectable({ providedIn: 'root' })
// export class LoggerService { ... }

// ---------------------------------------------------------------------------
// TODO 2: CounterService
// ---------------------------------------------------------------------------
// Create a CounterService decorated with @Injectable({ providedIn: 'root' }).
// Signals: count (starts at 0), doubled = computed(() => count() * 2).
// Methods: increment(), decrement(), reset().
//
// @Injectable({ providedIn: 'root' })
// export class CounterService { ... }

// ---------------------------------------------------------------------------
// TODO 3: ThemeService
// ---------------------------------------------------------------------------
// Create a ThemeService decorated with @Injectable({ providedIn: 'root' }).
// Signal: theme: Signal<'light' | 'dark'> (starts at 'light').
// Method: toggle() — switches between 'light' and 'dark'.
//
// @Injectable({ providedIn: 'root' })
// export class ThemeService { ... }

// ---------------------------------------------------------------------------
// TODO 4: CounterComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-counter'.
// Inject CounterService using inject().
// Display count and doubled. Add increment/decrement/reset buttons.
//
// @Component({ selector: 'app-counter', standalone: true, ... })
// export class CounterComponent { ... }

// ---------------------------------------------------------------------------
// TODO 5: ThemeToggleComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-theme-toggle'.
// Inject ThemeService using inject().
// Display current theme. Add a toggle button.
// Apply a background style based on the current theme signal.
//
// @Component({ selector: 'app-theme-toggle', standalone: true, ... })
// export class ThemeToggleComponent { ... }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO: Add CounterComponent and ThemeToggleComponent
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 3.2 — Services &amp; Dependency Injection</h1>
      <!-- TODO: render CounterComponent and ThemeToggleComponent -->
    </div>
  `,
})
export class AppComponent {}
