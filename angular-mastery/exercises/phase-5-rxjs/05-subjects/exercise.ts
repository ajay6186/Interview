import { Component } from '@angular/core';

// ============================================================
// Exercise 5.5 — Subjects
// ============================================================
// Topics:
//   • Subject — hot multicast, no initial value
//   • BehaviorSubject — holds current value
//   • ReplaySubject — replays N last values
//   • AsyncSubject — emits only the last value on complete
//   • Subjects as shared state stores
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: SubjectComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-plain-subject'.
// Create a Subject<string>() as an event bus.
// Create two sibling components that share it:
//   - PublisherComponent: has a button that emits a string to the Subject
//   - ListenerComponent: subscribes and displays received events
// Show that plain Subject does NOT replay to late subscribers.
//
// @Component({ selector: 'app-plain-subject', standalone: true, ... })
// export class SubjectComponent { ... }

// ---------------------------------------------------------------------------
// TODO 2: BehaviorSubjectComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-behavior-subject'.
// Use a BehaviorSubject<{ name: string } | null>(null) to represent a logged-in user.
// Create Login/Logout buttons that update the subject.
// Display the current user state (or 'Guest' when null).
// Demonstrate that a new subscriber immediately gets the current value.
//
// @Component({ selector: 'app-behavior-subject', standalone: true, ... })
// export class BehaviorSubjectComponent { ... }

// ---------------------------------------------------------------------------
// TODO 3: ReplaySubjectComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-replay-subject'.
// Use a ReplaySubject<string>(3) that holds the last 3 events.
// Add a "Emit Event" button and show all events in a list.
// Add a "Late Subscribe" button that subscribes after some events have been emitted
// and show what it receives immediately (the last 3 replayed values).
//
// @Component({ selector: 'app-replay-subject', standalone: true, ... })
// export class ReplaySubjectComponent { ... }

// ---------------------------------------------------------------------------
// TODO 4: AsyncSubjectComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-async-subject'.
// Use an AsyncSubject<number>().
// Emit several values (1, 2, 3) then call .complete().
// Subscribe before and after complete.
// Show that only the last value (3) is emitted, and only on complete.
//
// @Component({ selector: 'app-async-subject', standalone: true, ... })
// export class AsyncSubjectComponent { ... }

// ---------------------------------------------------------------------------
// TODO 5: SharedStateComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-shared-state'.
// Build a simple store service using a BehaviorSubject<AppState>:
//   interface AppState { count: number; user: string; }
// Create two sibling components (StateIncrementor, StateDisplay)
// that both inject the service to read/update state.
//
// @Component({ selector: 'app-shared-state', standalone: true, ... })
// export class SharedStateComponent { ... }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO: Add all exercise components
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 5.5 — Subjects</h1>
      <!-- TODO: render all components -->
    </div>
  `,
})
export class AppComponent {}
