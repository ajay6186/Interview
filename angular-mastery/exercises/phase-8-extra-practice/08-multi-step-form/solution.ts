import { Component, Injectable, inject, signal, Input, Output,
         EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { JsonPipe } from '@angular/common';

// ============================================================
// Solution 8.8 — Multi-Step Form Wizard
// ============================================================

// SOLUTION 5a: FormWizardService
@Injectable({ providedIn: 'root' })
class FormWizardService {
  currentStep = signal(1);
  formData    = signal<{ personal: Record<string, unknown>; address: Record<string, unknown> }>({
    personal: {}, address: {}
  });
  submitted   = signal(false);

  next()   { this.currentStep.update(s => Math.min(s + 1, 3)); }
  prev()   { this.currentStep.update(s => Math.max(s - 1, 1)); }
  submit() { this.submitted.set(true); }

  savePersonal(data: Record<string, unknown>) { this.formData.update(d => ({ ...d, personal: data })); }
  saveAddress(data: Record<string, unknown>)  { this.formData.update(d => ({ ...d, address: data })); }
}

// SOLUTION 1: Stepper
@Component({
  selector: 'app-stepper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="margin-bottom:24px;">
      <div style="background:#e0e0e0;border-radius:4px;height:8px;margin-bottom:12px;">
        <div [style.width]="progress + '%'" style="background:#007bff;height:100%;border-radius:4px;transition:width 0.3s;"></div>
      </div>
      <div style="display:flex;gap:16px;">
        @for (step of steps; track step) {
          <span [style.fontWeight]="step === currentStep ? 'bold' : 'normal'"
                [style.color]="step <= currentStep ? '#007bff' : '#999'">
            Step {{ step }}
          </span>
        }
      </div>
    </div>
  `,
})
class StepperComponent {
  @Input() currentStep = 1;
  @Input() totalSteps  = 3;
  get steps() { return Array.from({ length: this.totalSteps }, (_, i) => i + 1); }
  get progress() { return (this.currentStep / this.totalSteps) * 100; }
}

// SOLUTION 2: Step 1 — Personal info
@Component({
  selector: 'app-step1-personal',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form">
      <h3>Step 1: Personal Info</h3>
      <div>
        <label>Name: <input formControlName="name" /></label>
        @if (f['name'].invalid && f['name'].touched) { <span style="color:red"> Required</span> }
      </div><br />
      <div>
        <label>Email: <input formControlName="email" type="email" /></label>
        @if (f['email'].invalid && f['email'].touched) { <span style="color:red"> Valid email required</span> }
      </div><br />
      <div>
        <label>Phone: <input formControlName="phone" placeholder="555-555-5555" /></label>
        @if (f['phone'].invalid && f['phone'].touched) { <span style="color:red"> Valid phone required</span> }
      </div>
    </form>
  `,
})
class Step1PersonalComponent {
  @Output() formReady = new EventEmitter<FormGroup>();
  form = new FormGroup({
    name:  new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    phone: new FormControl('', [Validators.required, Validators.pattern(/^\d{3}-\d{3}-\d{4}$/)]),
  });
  get f() { return this.form.controls; }
}

// SOLUTION 3: Step 2 — Address
@Component({
  selector: 'app-step2-address',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form">
      <h3>Step 2: Address</h3>
      <div><label>Street: <input formControlName="street" /></label>
        @if (f['street'].invalid && f['street'].touched) { <span style="color:red"> Required</span> }
      </div><br />
      <div style="display:flex;gap:8px;">
        <label>City: <input formControlName="city" /></label>
        <label>State: <input formControlName="state" style="width:60px;" /></label>
        <label>ZIP: <input formControlName="zip" style="width:80px;" /></label>
      </div>
      @if (f['zip'].invalid && f['zip'].touched) { <span style="color:red"> 5-digit ZIP required</span> }
    </form>
  `,
})
class Step2AddressComponent {
  @Output() formReady = new EventEmitter<FormGroup>();
  form = new FormGroup({
    street: new FormControl('', Validators.required),
    city:   new FormControl('', Validators.required),
    state:  new FormControl('', Validators.required),
    zip:    new FormControl('', [Validators.required, Validators.pattern(/^\d{5}$/)]),
  });
  get f() { return this.form.controls; }
}

// SOLUTION 4: Step 3 — Review
@Component({
  selector: 'app-step3-review',
  standalone: true,
  imports: [JsonPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h3>Step 3: Review</h3>
      <h4>Personal</h4>
      <pre style="background:#f4f4f4;padding:8px;border-radius:4px;">{{ formData.personal | json }}</pre>
      <h4>Address</h4>
      <pre style="background:#f4f4f4;padding:8px;border-radius:4px;">{{ formData.address | json }}</pre>
      <button (click)="confirmed.emit()" style="background:#2ecc71;color:#fff;border:none;padding:8px 24px;border-radius:4px;cursor:pointer;margin-top:8px;">
        Confirm &amp; Submit
      </button>
    </div>
  `,
})
class Step3ReviewComponent {
  @Input() formData: { personal: Record<string, unknown>; address: Record<string, unknown> } = { personal: {}, address: {} };
  @Output() confirmed = new EventEmitter<void>();
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [StepperComponent, Step1PersonalComponent, Step2AddressComponent, Step3ReviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Multi-Step Form Wizard</h1>

      @if (wizard.submitted()) {
        <div style="text-align:center;padding:40px;">
          <h2 style="color:green;">Submission Complete!</h2>
          <p>Thank you for your submission.</p>
          <button (click)="wizard.currentStep.set(1); wizard.submitted.set(false)">Start Over</button>
        </div>
      } @else {
        <app-stepper [currentStep]="wizard.currentStep()" [totalSteps]="3" />

        @switch (wizard.currentStep()) {
          @case (1) {
            <app-step1-personal #step1 />
            <div style="margin-top:16px;">
              <button (click)="nextFromStep1(step1)"
                      style="background:#007bff;color:#fff;border:none;padding:8px 24px;border-radius:4px;cursor:pointer;">
                Next →
              </button>
            </div>
          }
          @case (2) {
            <app-step2-address #step2 />
            <div style="margin-top:16px;display:flex;gap:8px;">
              <button (click)="wizard.prev()">← Back</button>
              <button (click)="nextFromStep2(step2)"
                      style="background:#007bff;color:#fff;border:none;padding:8px 24px;border-radius:4px;cursor:pointer;">
                Next →
              </button>
            </div>
          }
          @case (3) {
            <app-step3-review [formData]="wizard.formData()" (confirmed)="wizard.submit()" />
            <div style="margin-top:8px;">
              <button (click)="wizard.prev()">← Back</button>
            </div>
          }
        }
      }
    </div>
  `,
})
export class AppComponent {
  wizard = inject(FormWizardService);

  nextFromStep1(step1: Step1PersonalComponent) {
    step1.form.markAllAsTouched();
    if (step1.form.valid) { this.wizard.savePersonal(step1.form.value as Record<string, unknown>); this.wizard.next(); }
  }

  nextFromStep2(step2: Step2AddressComponent) {
    step2.form.markAllAsTouched();
    if (step2.form.valid) { this.wizard.saveAddress(step2.form.value as Record<string, unknown>); this.wizard.next(); }
  }
}
