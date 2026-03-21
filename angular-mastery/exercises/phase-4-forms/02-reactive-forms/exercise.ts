import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

// ============================================================
// Exercise 4.2 — Reactive Forms
// ============================================================
// Topics:
//   • FormControl and valueChanges Observable
//   • FormGroup with multiple fields
//   • FormBuilder for concise form setup
//   • Form state: valid, dirty, touched
//   • Programmatic enable/disable
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: SimpleReactiveComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-simple-reactive'.
// Import ReactiveFormsModule.
// Create a FormControl: nameCtrl = new FormControl('').
// Subscribe to nameCtrl.valueChanges in the constructor and store the latest value.
// Display the current value and the live updates.
//
// @Component({ selector: 'app-simple-reactive', standalone: true, imports: [ReactiveFormsModule], ... })
// export class SimpleReactiveComponent { ... }

// ---------------------------------------------------------------------------
// TODO 2: LoginReactiveComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-login-reactive'.
// Import ReactiveFormsModule.
// Create a FormGroup with email (required, Validators.email) and password (required, minLength 8).
// Bind the group to a <form [formGroup]="form">.
// On submit, log form.value if form.valid.
// Disable submit button when form.invalid.
//
// @Component({ selector: 'app-login-reactive', standalone: true, imports: [ReactiveFormsModule], ... })
// export class LoginReactiveComponent { ... }

// ---------------------------------------------------------------------------
// TODO 3: ProfileFormComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-profile-form'.
// Import ReactiveFormsModule.
// Use FormBuilder (inject it) to build a form with:
//   - firstName, lastName (required)
//   - email (required, Validators.email)
//   - address: nested FormGroup with street, city, zip
// Display the form.value as JSON below the form.
//
// @Component({ selector: 'app-profile-form', standalone: true, imports: [ReactiveFormsModule], ... })
// export class ProfileFormComponent { ... }

// ---------------------------------------------------------------------------
// TODO 4: FormStateComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-form-state'.
// Import ReactiveFormsModule.
// Create a simple FormGroup with a single "notes" textarea FormControl.
// Display: form.valid, form.invalid, form.dirty, form.touched, form.pristine states.
// Update when the user types.
//
// @Component({ selector: 'app-form-state', standalone: true, imports: [ReactiveFormsModule], ... })
// export class FormStateComponent { ... }

// ---------------------------------------------------------------------------
// TODO 5: DisableEnableComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-disable-enable'.
// Import ReactiveFormsModule.
// Create a FormControl for an input.
// Add buttons to call control.disable() and control.enable().
// Display whether the control is enabled or disabled.
//
// @Component({ selector: 'app-disable-enable', standalone: true, imports: [ReactiveFormsModule], ... })
// export class DisableEnableComponent { ... }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO: Add all exercise components
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 4.2 — Reactive Forms</h1>
      <!-- TODO: render all components -->
    </div>
  `,
})
export class AppComponent {}
