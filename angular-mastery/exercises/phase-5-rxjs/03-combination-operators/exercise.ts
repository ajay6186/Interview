import { Component } from '@angular/core';

// ============================================================
// Exercise 5.3 — Combination Operators
// ============================================================
// Topics:
//   • combineLatest — emit when any source emits (with all latest)
//   • forkJoin — parallel completion, emit once when all done
//   • merge — merge multiple streams into one
//   • zip — pair items one-by-one
//   • withLatestFrom — include latest value from another stream
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: CombineLatestComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-combine-latest'.
// Create two BehaviorSubjects: slider1$ (0-100), slider2$ (0-100).
// Use combineLatest([slider1$, slider2$]) to display both values together
// and their sum whenever either changes.
// Use two range inputs bound to the subjects.
//
// @Component({ selector: 'app-combine-latest', standalone: true, ... })
// export class CombineLatestComponent { ... }

// ---------------------------------------------------------------------------
// TODO 2: ForkJoinComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-fork-join'.
// On button click, use forkJoin to fire 3 parallel simulated HTTP calls
// (use of(...).pipe(delay(...))).
// Show all results at once after all 3 complete.
// Show a loading indicator while waiting.
//
// @Component({ selector: 'app-fork-join', standalone: true, ... })
// export class ForkJoinComponent { ... }

// ---------------------------------------------------------------------------
// TODO 3: MergeComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-merge'.
// Create two Subjects (stream1$, stream2$).
// Use merge(stream1$, stream2$) to listen to both.
// Create two buttons that emit to each stream.
// Display a merged log of events from both streams.
//
// @Component({ selector: 'app-merge', standalone: true, ... })
// export class MergeComponent { ... }

// ---------------------------------------------------------------------------
// TODO 4: ZipComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-zip'.
// Create two Observables: names$ = from(['Alice','Bob','Carol']),
// scores$ = from([95, 87, 72]).
// Use zip(names$, scores$) to pair them up and display each pair.
//
// @Component({ selector: 'app-zip', standalone: true, ... })
// export class ZipComponent { ... }

// ---------------------------------------------------------------------------
// TODO 5: WithLatestFromComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-with-latest-from'.
// Create a BehaviorSubject<string> for current username.
// Create a Subject that emits on button click.
// Use withLatestFrom(username$) so each click captures the current username.
// Display a log of "user X clicked at time T".
//
// @Component({ selector: 'app-with-latest-from', standalone: true, ... })
// export class WithLatestFromComponent { ... }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO: Add all exercise components
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 5.3 — Combination Operators</h1>
      <!-- TODO: render all components -->
    </div>
  `,
})
export class AppComponent {}
