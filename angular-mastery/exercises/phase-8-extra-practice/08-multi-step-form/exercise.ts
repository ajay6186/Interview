import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

// ============================================================
// Exercise 8.8 — Multi-Step Form Wizard
// ============================================================
// Topics:
//   • Signal-based wizard state management
//   • ReactiveFormsModule with per-step validation
//   • Progress bar
//   • Review/confirm step
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: StepperComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-stepper'.
// Accept @Input() currentStep: number and @Input() totalSteps: number.
// Display:
//   - A progress bar: width = (currentStep / totalSteps) * 100%
//   - Step indicators: Step 1 | Step 2 | Step 3
//   - Highlight the current step
//
// @Component({ selector: 'app-stepper', standalone: true, ... })
// export class StepperComponent { ... }

// ---------------------------------------------------------------------------
// TODO 2: Step1PersonalComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-step1-personal'.
// Import ReactiveFormsModule.
// Form fields: name (required), email (required, email), phone (required, pattern).
// Emit (formReady) event with FormGroup when the step is valid.
// Display validation errors inline.
//
// @Component({ selector: 'app-step1-personal', standalone: true, ... })
// export class Step1PersonalComponent { ... }

// ---------------------------------------------------------------------------
// TODO 3: Step2AddressComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-step2-address'.
// Import ReactiveFormsModule.
// Form fields: street (required), city (required), state (required), zip (required, 5-digit pattern).
// Emit (formReady) event with FormGroup when valid.
//
// @Component({ selector: 'app-step2-address', standalone: true, ... })
// export class Step2AddressComponent { ... }

// ---------------------------------------------------------------------------
// TODO 4: Step3ReviewComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-step3-review'.
// Accept @Input() formData: { personal: any; address: any }.
// Display all collected data in a read-only summary.
// Emit (confirmed) event with no payload when user confirms.
//
// @Component({ selector: 'app-step3-review', standalone: true, ... })
// export class Step3ReviewComponent { ... }

// ---------------------------------------------------------------------------
// TODO 5: FormWizardService + Root Component
// ---------------------------------------------------------------------------
// Create a FormWizardService decorated with @Injectable({ providedIn: 'root' }).
// Signals: currentStep (1-3), formData { personal: any; address: any }.
// Methods: next(), prev(), submit().
//
// The AppComponent should orchestrate the wizard:
//   - Show StepperComponent at the top
//   - Show the current step component based on currentStep
//   - Show Next/Back buttons
//   - On final submit, show a success message
//
// @Injectable({ providedIn: 'root' })
// export class FormWizardService { ... }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO: Add StepperComponent, Step1PersonalComponent, Step2AddressComponent, Step3ReviewComponent
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 8.8 — Multi-Step Form Wizard</h1>
      <!-- TODO: render the form wizard -->
    </div>
  `,
})
export class AppComponent {}
