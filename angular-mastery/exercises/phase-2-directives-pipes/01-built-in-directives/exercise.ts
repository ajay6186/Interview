import { Component } from '@angular/core';

// ============================================================
// Exercise 2.1 — Built-in Directives
// ============================================================
// Topics:
//   • NgClass  — [ngClass]="{ 'cls': expr }" | [class.x]="expr"
//   • NgStyle  — [ngStyle]="{ color: expr }" | [style.x]="expr"
//   • NgModel  — [(ngModel)]  (requires FormsModule)
//   • NgIf / @if equivalence (structural vs control flow)
//   • NgFor / @for equivalence
//   • NgSwitch / @switch equivalence
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: StyleDemoComponent
// ---------------------------------------------------------------------------
// selector='app-style-demo'
// Local state: color = '#3498db', fontSize = 16, bold = false
// Template: a paragraph that uses [ngStyle] to apply color + font-size,
//   [ngClass]="{ 'bold-text': bold }" for bold toggle,
//   three range/color inputs to control state.
// Add styles: ['.bold-text { font-weight: bold; }']

// ---------------------------------------------------------------------------
// TODO 2: ClassBindingComponent
// ---------------------------------------------------------------------------
// selector='app-class-binding'
// Local state: status: 'success' | 'warning' | 'error' = 'success'
//              isActive = true, count = 0
// Template: a div that uses [ngClass] with an object expression
//   mapping status values to CSS classes (success=green, warning=amber, error=red).
//   A button to cycle through statuses.
//   Add styles for .success, .warning, .error classes.

// ---------------------------------------------------------------------------
// TODO 3: TwoWayBindingComponent
// ---------------------------------------------------------------------------
// selector='app-two-way'
// Requires FormsModule in imports[].
// Local state: name = 'Angular', age = 17, agree = false
// Template: text input [(ngModel)]="name", number input [(ngModel)]="age",
//   checkbox [(ngModel)]="agree".
//   Below the inputs, show a live preview: "Hello, {{ name }}! Age: {{ age }}.
//   Terms: {{ agree ? 'accepted' : 'not accepted' }}"

// ---------------------------------------------------------------------------
// TODO 4: NgForFeaturesComponent
// ---------------------------------------------------------------------------
// selector='app-ngfor-features'
// Local items: string[] = ['Angular','React','Vue','Svelte','Solid']
// Template using *ngFor (classic directive — NOT @for):
//   Render an <li> for each item showing index, first/last badge, even/odd stripe.
//   Show a Remove button on each item.
// Implement removeItem(index: number) in the class.

// ---------------------------------------------------------------------------
// TODO 5: NgSwitchComponent
// ---------------------------------------------------------------------------
// selector='app-ngswitch'
// Local state: tab: 'overview' | 'details' | 'settings' = 'overview'
// Template using [ngSwitch] / *ngSwitchCase / *ngSwitchDefault:
//   Three tab buttons at the top.
//   Panel area that switches between tab content panels.
// (NgSwitch / NgSwitchCase / NgSwitchDefault need to be imported)

// ---------------------------------------------------------------------------
// ROOT COMPONENT
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  template: `
    <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 2.1 — Built-in Directives</h1>
      <!-- TODO 6: add all components to imports[] and render them here -->
    </div>
  `,
})
export class AppComponent {}
