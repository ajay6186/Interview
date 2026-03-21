import { Component } from '@angular/core';

// ============================================================
// Exercise 5.1 — Observables
// ============================================================
// Topics:
//   • Observable creation: of(), from(), interval(), timer()
//   • Subscribing and unsubscribing
//   • BehaviorSubject for shared state
//   • toSignal() for bridging RxJS and Signals
//   • async pipe for template subscriptions
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: ObservableCreationComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-observable-creation'.
// Demonstrate 4 creation operators:
//   - of(1, 2, 3) — collect values into an array signal
//   - from(['a', 'b', 'c']) — collect into an array signal
//   - interval(500) — display tick count (auto-unsubscribe after 5 ticks)
//   - timer(0, 1000) — display a countdown from 5
// Use takeUntilDestroyed for cleanup.
//
// @Component({ selector: 'app-observable-creation', standalone: true, ... })
// export class ObservableCreationComponent { ... }

// ---------------------------------------------------------------------------
// TODO 2: SubscriptionComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-subscription'.
// Subscribe to interval(1000) and display current value.
// Use takeUntilDestroyed(destroyRef) to auto-unsubscribe on destroy.
// Show a log of the last 5 values received.
//
// @Component({ selector: 'app-subscription', standalone: true, ... })
// export class SubscriptionComponent { ... }

// ---------------------------------------------------------------------------
// TODO 3: SubjectComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-subject'.
// Create a BehaviorSubject<number>(0) at module level (shared state).
// Create two child components (SenderComponent, ReceiverComponent) that both
// use the same BehaviorSubject. Sender has +/- buttons, Receiver displays the value.
//
// @Component({ selector: 'app-subject', standalone: true, ... })
// export class SubjectComponent { ... }

// ---------------------------------------------------------------------------
// TODO 4: ToSignalComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-to-signal'.
// Convert an Observable to a Signal using toSignal() from '@angular/core/rxjs-interop'.
// Use interval(1000) converted to a signal, display the value.
// Also use toSignal() with a custom Observable (of some strings).
//
// @Component({ selector: 'app-to-signal', standalone: true, ... })
// export class ToSignalComponent { ... }

// ---------------------------------------------------------------------------
// TODO 5: AsyncPipeComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-async-pipe'.
// Declare an Observable<string[]> that emits arrays of names after a delay.
// Use the async pipe in the template to subscribe and display the names.
// Also show a "loading..." message while waiting.
// Import AsyncPipe from '@angular/common'.
//
// @Component({ selector: 'app-async-pipe', standalone: true, imports: [AsyncPipe], ... })
// export class AsyncPipeComponent { ... }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO: Add all exercise components
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 5.1 — Observables</h1>
      <!-- TODO: render all components -->
    </div>
  `,
})
export class AppComponent {}
