import { Component, Input, OnInit, OnChanges, OnDestroy, AfterViewInit,
         DoCheck, SimpleChanges, ViewChild, ElementRef, DestroyRef, inject } from '@angular/core';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// ============================================================
// Exercise 3.1 — Lifecycle Hooks
// ============================================================
// Topics:
//   • ngOnInit
//   • ngOnChanges
//   • ngOnDestroy / takeUntilDestroyed
//   • ngAfterViewInit
//   • ngDoCheck
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: OnInitComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-on-init'.
// Inject a mock DataService (class below, already provided).
// In ngOnInit, call dataService.loadData() and store the result in `data`.
// Display the loaded data in the template.
//
// class MockDataService {
//   loadData() { return ['Item A', 'Item B', 'Item C']; }
// }
//
// @Component({ selector: 'app-on-init', standalone: true, ... })
// export class OnInitComponent implements OnInit { ... }

// ---------------------------------------------------------------------------
// TODO 2: OnChangesComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-on-changes'.
// Accept @Input() name: string = ''.
// Use ngOnChanges(changes: SimpleChanges) to track the previous and current
// value of `name`. Store them in `prevName` and `currName`.
// Display prevName → currName in the template.
//
// @Component({ selector: 'app-on-changes', standalone: true, ... })
// export class OnChangesComponent implements OnChanges { ... }

// ---------------------------------------------------------------------------
// TODO 3: OnDestroyComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-on-destroy'.
// Inject DestroyRef using inject(DestroyRef).
// Subscribe to interval(1000) using takeUntilDestroyed(destroyRef).
// Display the tick count in the template.
// Add a log message when the component is destroyed.
//
// @Component({ selector: 'app-on-destroy', standalone: true, ... })
// export class OnDestroyComponent implements OnDestroy { ... }

// ---------------------------------------------------------------------------
// TODO 4: AfterViewInitComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-after-view-init'.
// Use @ViewChild('myInput') to get a reference to an <input #myInput>.
// In ngAfterViewInit, call this.myInput.nativeElement.focus().
// Display a label and the focused input in the template.
//
// @Component({ selector: 'app-after-view-init', standalone: true, ... })
// export class AfterViewInitComponent implements AfterViewInit { ... }

// ---------------------------------------------------------------------------
// TODO 5: DoCheckComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-do-check'.
// Declare: obj = { value: 0 } (a mutable object reference).
// Use ngDoCheck to compare obj.value to a `lastValue` and detect changes.
// Add a button to increment obj.value directly (mutating the object).
// Display how many times ngDoCheck detected a real change.
// (This demonstrates why OnPush + signals is better for change detection.)
//
// @Component({ selector: 'app-do-check', standalone: true, ... })
// export class DoCheckComponent implements DoCheck { ... }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO 6: Add all exercise components to imports[]
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 3.1 — Lifecycle Hooks</h1>
      <!-- TODO 6: render all five exercise components here -->
    </div>
  `,
})
export class AppComponent {}
