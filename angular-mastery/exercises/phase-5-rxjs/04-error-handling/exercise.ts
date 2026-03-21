import { Component } from '@angular/core';

// ============================================================
// Exercise 5.4 — RxJS Error Handling
// ============================================================
// Topics:
//   • catchError — intercept errors and return fallback
//   • retry / retryWhen — automatic retry on failure
//   • throwError — re-throw or create errors
//   • EMPTY — complete without emitting
//   • Error boundary patterns
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: CatchErrorComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-catch-error'.
// Inject HttpClient.
// On button click, fetch from a URL that will fail.
// Use catchError to catch the HttpErrorResponse and set an error message signal.
// Display the error message in the template.
//
// @Component({ selector: 'app-catch-error', standalone: true, ... })
// export class CatchErrorComponent { ... }

// ---------------------------------------------------------------------------
// TODO 2: RetryComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-retry'.
// Create a simulated flaky Observable that fails 2 times before succeeding
// (use a counter and throwError vs of(value)).
// Use retry(3) to retry up to 3 times before giving up.
// Show attempt count and final result or error.
//
// @Component({ selector: 'app-retry', standalone: true, ... })
// export class RetryComponent { ... }

// ---------------------------------------------------------------------------
// TODO 3: FallbackComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-fallback'.
// Create an Observable that always fails.
// Use catchError to return fallback data with of(['Fallback Item 1', 'Fallback Item 2']).
// Display the fallback data seamlessly.
//
// @Component({ selector: 'app-fallback', standalone: true, ... })
// export class FallbackComponent { ... }

// ---------------------------------------------------------------------------
// TODO 4: ErrorBoundaryComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-error-boundary'.
// Inject HttpClient.
// Fetch from a bad URL. Catch the error.
// Display: error message and a "Retry" button that re-fetches.
// Show loading state while fetching.
//
// @Component({ selector: 'app-error-boundary', standalone: true, ... })
// export class ErrorBoundaryComponent { ... }

// ---------------------------------------------------------------------------
// TODO 5: PartialFailureComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-partial-failure'.
// Run 3 parallel requests (forkJoin or combineLatest).
// One of them will fail.
// Use catchError on each individual request to return null for failed ones.
// Display successful results and indicate which ones failed.
//
// @Component({ selector: 'app-partial-failure', standalone: true, ... })
// export class PartialFailureComponent { ... }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO: Add all exercise components
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 5.4 — Error Handling</h1>
      <!-- TODO: render all components -->
    </div>
  `,
})
export class AppComponent {}
