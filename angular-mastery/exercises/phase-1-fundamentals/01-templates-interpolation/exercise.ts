import { Component } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';

// ============================================================
// Exercise 1.1 — Templates & Interpolation
// ============================================================
// Topics:
//   • String interpolation  {{ expression }}
//   • Property binding      [property]="expression"
//   • Attribute binding     [attr.x]="expression"
//   • Event binding         (event)="handler()"
//   • Safe navigation       {{ obj?.prop }}
//   • Built-in pipes        {{ value | pipeName }}
// ============================================================

const user = {
  firstName: 'Jane',
  lastName: 'Doe',
  role: 'Senior Developer',
  yearsOfExperience: 7,
  joinDate: new Date('2022-03-15'),
};

const skills = ['Angular', 'TypeScript', 'RxJS', 'NgRx', 'CSS'];

// ---------------------------------------------------------------------------
// TODO 1: GreetingComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-greeting'.
// Declare a fullName property built from user.firstName and user.lastName.
// Template should render:  <h2>Hello, Jane Doe!</h2>
// Hint: use {{ firstName }} {{ lastName }} OR build a fullName property.

// @Component({ ... })
// export class GreetingComponent { ... }

// ---------------------------------------------------------------------------
// TODO 2: UserProfileComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-user-profile'.
// Use expressions inside {{ }} for:
//   - user.role
//   - yearsOfExperience * 12  (months of experience)
//   - ternary: yearsOfExperience >= 5 ? 'Senior' : 'Junior'
// Template should render a <section> with an <h3> title and 3 <p> tags.

// @Component({ ... })
// export class UserProfileComponent { ... }

// ---------------------------------------------------------------------------
// TODO 3: PropertyBindingComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-property-binding'.
// Use property binding [ ] to:
//   - bind [src] and [alt] on an <img>
//   - bind [disabled] on a <button>
//   - bind [class.highlight] on a <div> using a boolean property
// Add a button that calls a method to toggle the disabled state.

// @Component({ ... })
// export class PropertyBindingComponent { ... }

// ---------------------------------------------------------------------------
// TODO 4: EventBindingComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-event-binding'.
// Maintain a count = 0 property.
// Use (click) event binding on buttons for increment / decrement / reset.
// Display the current count using interpolation.

// @Component({ ... })
// export class EventBindingComponent { ... }

// ---------------------------------------------------------------------------
// TODO 5: SafeNavAndPipesComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-safe-nav'.
// Declare: activeUser: { name: string; email: string } | null = null
// Template should:
//   - Use ?. to safely access activeUser?.name (shows nothing if null)
//   - Use the | uppercase pipe on activeUser?.email
//   - Use the | date:'mediumDate' pipe to display user.joinDate
//   - Add a button to toggle activeUser between null and a real object
// Import DatePipe and UpperCasePipe in imports: [].

// @Component({ ... })
// export class SafeNavAndPipesComponent { ... }

// ---------------------------------------------------------------------------
// ROOT COMPONENT — assemble all exercises here
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO 6: Add all exercise components to imports[]
    // then render them inside the template separated by <hr>
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 1.1 — Templates &amp; Interpolation</h1>
      <!-- TODO 6: render all five exercise components here -->
    </div>
  `,
})
export class AppComponent {}
