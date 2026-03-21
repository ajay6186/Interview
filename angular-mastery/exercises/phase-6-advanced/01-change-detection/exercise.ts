// Phase 6 - Exercise 01: Change Detection
// Topics: ChangeDetectionStrategy.OnPush, markForCheck, detectChanges,
//         ChangeDetectorRef, signal() automatic tracking, async pipe + OnPush
//
// Docs: https://angular.dev/guide/components/advanced-configuration#changedetectionstrategy

import { Component } from '@angular/core';

// ─────────────────────────────────────────────
// TODO 1: OnPushComponent — uses OnPush strategy with @Input() objects
//
// @Component({
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   ...
// })
// export class OnPushComponent {
//   @Input() user!: { name: string; age: number };
//   // With OnPush, this component only re-renders when:
//   // 1. An @Input() reference changes (not mutation)
//   // 2. An event originates from this component or its children
//   // 3. An Observable in the template emits (via async pipe)
//   // 4. markForCheck() / detectChanges() is called manually
// }
//
// In the parent, show both cases:
// - BAD:  this.user.name = 'New Name'     ← same reference, OnPush won't detect!
// - GOOD: this.user = { ...this.user, name: 'New Name' } ← new reference, works!
// ─────────────────────────────────────────────

// TODO 1: OnPushComponent + parent that shows the reference comparison trap
// @Component({ changeDetection: ChangeDetectionStrategy.OnPush, ... })
// export class OnPushComponent { }

// ─────────────────────────────────────────────
// TODO 2: Stale reference bug demo
//
// Create MutableObjectComponent:
// - parent has user = { name: 'Alice' }
// - "Mutate (BAD)" button: this.user.name = 'Bob' — OnPush won't re-render child
// - "Immutable (GOOD)" button: this.user = { ...this.user, name: 'Bob' } — triggers CD
// - Show the OnPush child receiving the @Input() and displaying the name
// ─────────────────────────────────────────────

// TODO 2: MutableObjectComponent (parent) + OnPushChildComponent
// @Component({ ... })
// export class MutableObjectComponent { }

// ─────────────────────────────────────────────
// TODO 3: ManualCDComponent — ChangeDetectorRef.markForCheck()
//
// Create ManualCDComponent with ChangeDetectionStrategy.OnPush:
// - Inject ChangeDetectorRef with inject(ChangeDetectorRef)
// - Start a setTimeout(1000) in ngOnInit that updates a local variable
// - Without markForCheck: UI won't update
// - With this.cdr.markForCheck(): schedules the component for the next CD cycle
// - Also show detectChanges(): runs CD synchronously right now
// ─────────────────────────────────────────────

// TODO 3: ManualCDComponent
// @Component({ changeDetection: ChangeDetectionStrategy.OnPush, ... })
// export class ManualCDComponent { }

// ─────────────────────────────────────────────
// TODO 4: OnPushWithSignals — signal-based component is always fine with OnPush
//
// Create OnPushWithSignalsComponent:
// - Use ChangeDetectionStrategy.OnPush
// - Use signal() for local state instead of plain class properties
// - Show that clicking a button (which calls signal.update()) ALWAYS triggers re-render
//   even with OnPush — because signals automatically mark the view dirty
// - No need for markForCheck() with signals!
// ─────────────────────────────────────────────

// TODO 4: OnPushWithSignalsComponent
// @Component({ changeDetection: ChangeDetectionStrategy.OnPush, ... })
// export class OnPushWithSignalsComponent { }

// ─────────────────────────────────────────────
// TODO 5: PureComponentDemo — compare OnPush+signals vs Default strategy
//
// Create two identical counter components:
// - DefaultCounterComponent: changeDetection: ChangeDetectionStrategy.Default
// - OnPushCounterComponent:  changeDetection: ChangeDetectionStrategy.OnPush + signal
//
// Add an unrelated timer in the parent that ticks every second.
// Use a counter to show how many times each child re-renders.
// Default strategy re-renders on every parent tick (bad for performance).
// OnPush+signal only re-renders when its own signal changes.
// ─────────────────────────────────────────────

// TODO 5: DefaultCounterComponent + OnPushCounterComponent
// @Component({ ... })
// export class DefaultCounterComponent { }
// @Component({ changeDetection: ChangeDetectionStrategy.OnPush, ... })
// export class OnPushCounterComponent { }

// ─────────────────────────────────────────────
// TODO 6: Add all components to imports[] and render them in AppComponent
// ─────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO 6: import components here
  ],
  template: `
    <h1>Change Detection Exercise</h1>
    <!-- TODO 6: render components here -->
  `,
})
export class AppComponent {}
