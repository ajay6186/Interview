import { Component } from '@angular/core';

// ============================================================
// Exercise 3.2 — RxJS & Observables
// ============================================================
// Topics:
//   • Observable creation: of(), from(), interval(), timer(),
//     fromEvent(), Subject, BehaviorSubject
//   • Operators: map, filter, debounceTime, distinctUntilChanged,
//     switchMap, mergeMap, combineLatest, takeUntil, take, tap, scan
//   • async pipe in templates
//   • Unsubscription: takeUntilDestroyed() (Angular 16+)
//   • Converting Observable ↔ Signal: toSignal(), toObservable()
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: TimerComponent
// ---------------------------------------------------------------------------
// selector='app-timer'
// Use interval(1000) + takeUntilDestroyed() (inject DestroyRef or use
//   the function form).
// Display the elapsed seconds in the template via async pipe.
// Add Start / Stop / Reset buttons.

// ---------------------------------------------------------------------------
// TODO 2: SearchComponent
// ---------------------------------------------------------------------------
// selector='app-search'
// Use a Subject<string> for search$
// Apply: debounceTime(300), distinctUntilChanged(), filter(q => q.length > 1)
// Simulate an HTTP call with switchMap + of(mockResults).pipe(delay(400))
// Show a loading indicator while the inner observable is pending.
// Use async pipe to display results.

// ---------------------------------------------------------------------------
// TODO 3: SubjectDemoComponent
// ---------------------------------------------------------------------------
// selector='app-subject-demo'
// Create a BehaviorSubject<number>(0) for a shared counter.
// Multiple consumers (just divs) subscribe via async pipe.
// Buttons call next() to mutate the subject.
// Show that ALL consumers update simultaneously.

// ---------------------------------------------------------------------------
// TODO 4: CombineLatestComponent
// ---------------------------------------------------------------------------
// selector='app-combine-latest'
// Two sliders (range inputs). Each feeds into a Subject<number>.
// Use combineLatest([a$, b$]) to compute sum$, product$, max$.
// Display all three derived values via async pipe.

// ---------------------------------------------------------------------------
// TODO 5: ToSignalComponent
// ---------------------------------------------------------------------------
// selector='app-to-signal'
// import { toSignal, toObservable } from '@angular/core/rxjs-interop'
// Create a signal count = signal(0).
// Use toObservable(count) to get count$.
// Apply scan to build a history Observable.
// Use toSignal(history$) to get a signal back for the template.
// Show the history list in the template.

// ---------------------------------------------------------------------------
// ROOT COMPONENT
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  template: `
    <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 3.2 — RxJS &amp; Observables</h1>
      <!-- TODO 6: add all components to imports[] and render them -->
    </div>
  `,
})
export class AppComponent {}
