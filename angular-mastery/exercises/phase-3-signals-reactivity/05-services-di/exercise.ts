import { Component } from '@angular/core';

// ============================================================
// Exercise 3.5 — Services & Dependency Injection
// ============================================================
// Topics:
//   • @Injectable({ providedIn: 'root' }) — singleton service
//   • inject() functional injection vs constructor injection
//   • InjectionToken<T> — typed tokens
//   • providedIn: 'root' vs component-level providers: []
//   • Service with signals — reactive state management
//   • provideValue / useValue / useFactory / useExisting
//   • Multi-providers
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: CounterService + CounterComponent
// ---------------------------------------------------------------------------
// Create CounterService with @Injectable({ providedIn: 'root' })
// State: count = signal(0)
// Methods: increment(), decrement(), reset()
// computed: doubled, isNegative
// Inject in CounterAComponent and CounterBComponent (two separate components)
// Show that BOTH components share the same state (singleton).

// ---------------------------------------------------------------------------
// TODO 2: ThemeService + ThemeConsumerComponent
// ---------------------------------------------------------------------------
// Create ThemeService with @Injectable({ providedIn: 'root' })
// State: theme = signal<'light' | 'dark'>('light')
// Method: toggle()
// Two consumer components that both read/display the theme and call toggle.
// Show that toggling in one updates the other.

// ---------------------------------------------------------------------------
// TODO 3: LoggerService (InjectionToken)
// ---------------------------------------------------------------------------
// Create LOG_PREFIX = new InjectionToken<string>('LOG_PREFIX')
// Create LoggerService that injects LOG_PREFIX and prefixes all messages.
// Provide the token at component level:
//   providers: [{ provide: LOG_PREFIX, useValue: '[MyComponent]' }]
// Show two components with DIFFERENT prefixes.

// ---------------------------------------------------------------------------
// TODO 4: CartService (component-level scope)
// ---------------------------------------------------------------------------
// Create CartService with NO providedIn (not root-level).
// Provide it in a parent component: providers: [CartService]
// Child components inject it via inject(CartService).
// Show the cart state in parent and child.
// Create a SIBLING parent with its OWN CartService instance to show isolation.

// ---------------------------------------------------------------------------
// TODO 5: ConfigService (useFactory + useValue)
// ---------------------------------------------------------------------------
// APP_CONFIG = new InjectionToken<{ apiUrl: string; debug: boolean }>('APP_CONFIG')
// Provide it at component level with useValue.
// ConfigService injects APP_CONFIG.
// Template: display the config values.

// ---------------------------------------------------------------------------
// ROOT COMPONENT
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  template: `
    <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 3.5 — Services &amp; DI</h1>
      <!-- TODO 6: add all components to imports[] and render them -->
    </div>
  `,
})
export class AppComponent {}
