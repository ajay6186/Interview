import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

// ============================================================
// Exercise 4.1 — Template-Driven Forms
// ============================================================
// Topics:
//   • FormsModule / ngModel
//   • Two-way binding [(ngModel)]
//   • Template reference variables #form="ngForm"
//   • Built-in validators via directives
//   • ngSubmit
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: SimpleFormComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-simple-form'.
// Import FormsModule.
// Declare: name = '', email = '', message = ''.
// Use [(ngModel)] for two-way binding on three fields: name, email, message.
// Add a submit button that calls onSubmit() and logs the values.
//
// @Component({ selector: 'app-simple-form', standalone: true, imports: [FormsModule], ... })
// export class SimpleFormComponent { ... }

// ---------------------------------------------------------------------------
// TODO 2: LoginFormComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-login-form'.
// Import FormsModule.
// Use #loginForm="ngForm" on the <form> element.
// Bind email (required, email) and password (required, minlength="8") with ngModel.
// Disable the submit button when loginForm.invalid.
// On submit, log the form values.
//
// @Component({ selector: 'app-login-form', standalone: true, imports: [FormsModule], ... })
// export class LoginFormComponent { ... }

// ---------------------------------------------------------------------------
// TODO 3: SelectAndCheckboxComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-select-checkbox'.
// Import FormsModule.
// Declare: selectedRole = 'user', notifications = false, terms = false.
// Use [(ngModel)] on:
//   - a <select> with options: admin, user, guest
//   - a checkbox for "Receive notifications"
//   - a checkbox for "I accept the terms"
// Display the selected values below the form.
//
// @Component({ selector: 'app-select-checkbox', standalone: true, imports: [FormsModule], ... })
// export class SelectAndCheckboxComponent { ... }

// ---------------------------------------------------------------------------
// TODO 4: TwoWayBindingComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-two-way'.
// Import FormsModule.
// Declare: text = ''.
// Use [(ngModel)] on a textarea.
// Show a live preview of the typed text below the textarea.
// Also show character count.
//
// @Component({ selector: 'app-two-way', standalone: true, imports: [FormsModule], ... })
// export class TwoWayBindingComponent { ... }

// ---------------------------------------------------------------------------
// TODO 5: TemplateValidationComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-template-validation'.
// Import FormsModule.
// Create a form with username (required, minlength="3", maxlength="20")
// and email (required, email validator).
// Show error messages under each field when invalid AND touched.
// Disable submit when form is invalid.
//
// @Component({ selector: 'app-template-validation', standalone: true, imports: [FormsModule], ... })
// export class TemplateValidationComponent { ... }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO: Add all exercise components
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 4.1 — Template-Driven Forms</h1>
      <!-- TODO: render all components -->
    </div>
  `,
})
export class AppComponent {}
