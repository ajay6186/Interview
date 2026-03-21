import { Component } from '@angular/core';

// ============================================================
// Exercise 3.4 — Reactive Forms
// ============================================================
// Topics:
//   • FormControl, FormGroup, FormArray
//   • ReactiveFormsModule — formGroup, formControlName, formArrayName
//   • Validators: required, minLength, maxLength, pattern, email
//   • Custom Validators: ValidatorFn, AbstractControl
//   • Cross-field validators (group-level)
//   • Async validators
//   • valueChanges, statusChanges Observables
//   • Dynamic form arrays (add/remove controls)
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: LoginFormComponent
// ---------------------------------------------------------------------------
// selector='app-login-form'
// FormGroup: email (required, email), password (required, minLength 8)
// Template: reactive form with validation messages.
// Disable submit button when form.invalid.

// ---------------------------------------------------------------------------
// TODO 2: RegistrationFormComponent
// ---------------------------------------------------------------------------
// selector='app-registration-form'
// FormGroup: username (required, minLength 3), email (required, email),
//   password (required, minLength 8), confirmPassword (required)
// Cross-field validator: passwords must match.
// Template: all inputs + match error message.

// ---------------------------------------------------------------------------
// TODO 3: DynamicFormArrayComponent
// ---------------------------------------------------------------------------
// selector='app-dynamic-form'
// FormArray of skill objects: { name: string; level: 'junior'|'mid'|'senior' }
// Methods: addSkill(), removeSkill(i)
// Template: list of form rows with input + select + remove button.
//   "Add Skill" button at the bottom.

// ---------------------------------------------------------------------------
// TODO 4: CustomValidatorComponent
// ---------------------------------------------------------------------------
// selector='app-custom-validator'
// Write a custom ValidatorFn: noWhitespace — returns error if value has spaces.
// Write a custom async ValidatorFn: checkUsernameAvailable —
//   returns Observable with error after 500ms if username === 'admin'.
// Apply both to a single form control.
// Show validation states with styling.

// ---------------------------------------------------------------------------
// TODO 5: ValueChangesComponent
// ---------------------------------------------------------------------------
// selector='app-value-changes'
// FormGroup with two number inputs: width and height.
// Use form.valueChanges.pipe(map(...)) to derive area, perimeter.
// Display them in a live "preview" section below the form.

// ---------------------------------------------------------------------------
// ROOT COMPONENT
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  template: `
    <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 3.4 — Reactive Forms</h1>
      <!-- TODO 6: add all components to imports[] and render them -->
    </div>
  `,
})
export class AppComponent {}
