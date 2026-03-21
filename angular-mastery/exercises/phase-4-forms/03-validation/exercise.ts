import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

// ============================================================
// Exercise 4.3 — Form Validation
// ============================================================
// Topics:
//   • Built-in Validators (required, minLength, email, pattern)
//   • Custom synchronous ValidatorFn
//   • Cross-field validators on FormGroup
//   • Async ValidatorFn (simulate server check)
//   • Reusable error message pattern
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: BuiltInValidatorsComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-builtin-validators'.
// Import ReactiveFormsModule.
// Create a FormGroup with:
//   - username: required, minLength(3), maxLength(20)
//   - email: required, Validators.email
//   - age: required, Validators.min(18), Validators.max(120)
//   - website: Validators.pattern('https?://.+')
// Show per-field error messages when invalid and touched.
//
// @Component({ selector: 'app-builtin-validators', standalone: true, ... })
// export class BuiltInValidatorsComponent { ... }

// ---------------------------------------------------------------------------
// TODO 2: CustomValidatorComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-custom-validator'.
// Import ReactiveFormsModule.
// Write two custom ValidatorFn functions:
//   - noSpacesValidator: returns { noSpaces: true } if value contains a space
//   - strongPasswordValidator: requires uppercase, lowercase, digit, and min length 8
// Apply them to a password field and show appropriate error messages.
//
// @Component({ selector: 'app-custom-validator', standalone: true, ... })
// export class CustomValidatorComponent { ... }

// ---------------------------------------------------------------------------
// TODO 3: CrossFieldValidatorComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-cross-field'.
// Import ReactiveFormsModule.
// Write a group-level ValidatorFn `passwordMatchValidator` that returns
// { passwordMismatch: true } if 'password' !== 'confirmPassword'.
// Apply it to a FormGroup. Show an error message at the group level.
//
// @Component({ selector: 'app-cross-field', standalone: true, ... })
// export class CrossFieldValidatorComponent { ... }

// ---------------------------------------------------------------------------
// TODO 4: AsyncValidatorComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-async-validator'.
// Import ReactiveFormsModule.
// Write an AsyncValidatorFn `usernameExistsValidator`:
//   - Simulate a server check with delay(800)
//   - Return { usernameTaken: true } if the value equals 'admin' or 'john'
//   - Return null otherwise
// Show "Checking..." while the async validation is pending.
//
// @Component({ selector: 'app-async-validator', standalone: true, ... })
// export class AsyncValidatorComponent { ... }

// ---------------------------------------------------------------------------
// TODO 5: ValidationMessagesComponent
// ---------------------------------------------------------------------------
// Create a reusable component with selector 'app-validation-messages'.
// It should accept an @Input() control: AbstractControl | null = null.
// It should accept an @Input() fieldName: string = 'Field'.
// Display the appropriate error messages based on control.errors.
// Use it inside a parent form component to show errors cleanly.
//
// @Component({ selector: 'app-validation-messages', standalone: true, ... })
// export class ValidationMessagesComponent { ... }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO: Add all exercise components
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 4.3 — Form Validation</h1>
      <!-- TODO: render all components -->
    </div>
  `,
})
export class AppComponent {}
