import { Component } from '@angular/core';

// ============================================================
// Exercise 5.2 — Transformation Operators
// ============================================================
// Topics:
//   • map, filter
//   • switchMap — cancels previous inner Observable
//   • concatMap — queues inner Observables
//   • mergeMap — concurrent inner Observables
//   • exhaustMap — ignores new until current completes
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: MapFilterComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-map-filter'.
// Define numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].
// Use from(numbers).pipe(map(x => x * 2), filter(x => x > 5)) to get results.
// Display the input array and the transformed/filtered results.
//
// @Component({ selector: 'app-map-filter', standalone: true, ... })
// export class MapFilterComponent { ... }

// ---------------------------------------------------------------------------
// TODO 2: SwitchMapComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-switch-map'.
// Create an input field. On each input event (debounceTime 300ms),
// switchMap to a simulated API call: of(`Results for "${term}"`).pipe(delay(500)).
// Show the result. Demonstrate that rapid typing cancels previous calls.
//
// @Component({ selector: 'app-switch-map', standalone: true, ... })
// export class SwitchMapComponent { ... }

// ---------------------------------------------------------------------------
// TODO 3: ConcatMapComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-concat-map'.
// Create a Subject that emits when a button is clicked.
// concatMap to a simulated async operation that takes 1 second.
// Show a log of completed operations (they should run one-at-a-time in order).
//
// @Component({ selector: 'app-concat-map', standalone: true, ... })
// export class ConcatMapComponent { ... }

// ---------------------------------------------------------------------------
// TODO 4: MergeMapComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-merge-map'.
// Create a list of 3 "requests" with different delays (500ms, 200ms, 800ms).
// Use from(requests).pipe(mergeMap(r => simulateRequest(r))) to run concurrently.
// Show the order they complete (should be out-of-order based on delay).
//
// @Component({ selector: 'app-merge-map', standalone: true, ... })
// export class MergeMapComponent { ... }

// ---------------------------------------------------------------------------
// TODO 5: ExhaustMapComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-exhaust-map'.
// Create a button that triggers a 2-second async operation.
// Use exhaustMap so rapid clicks are ignored while the operation is in flight.
// Show a counter of how many operations actually ran vs. how many clicks.
//
// @Component({ selector: 'app-exhaust-map', standalone: true, ... })
// export class ExhaustMapComponent { ... }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO: Add all exercise components
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 5.2 — Transformation Operators</h1>
      <!-- TODO: render all components -->
    </div>
  `,
})
export class AppComponent {}
