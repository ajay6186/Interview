import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators,
         ValidatorFn, AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { of, delay, map } from 'rxjs';

// ============================================================
// Solution 4.3 — Form Validation
// ============================================================

// SOLUTION 1: Built-in validators
@Component({
  selector: 'app-builtin-validators',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Built-in Validators</h3>
      <form [formGroup]="form">
        <div>
          <label>Username: <input formControlName="username" /></label>
          @if (f['username'].errors?.['required'] && f['username'].touched) { <span style="color:red"> Required</span> }
          @if (f['username'].errors?.['minlength'] && f['username'].touched) { <span style="color:red"> Min 3</span> }
        </div>
        <div>
          <label>Email: <input formControlName="email" type="email" /></label>
          @if (f['email'].errors?.['email'] && f['email'].touched) { <span style="color:red"> Invalid email</span> }
        </div>
        <div>
          <label>Age: <input formControlName="age" type="number" /></label>
          @if (f['age'].errors?.['min'] && f['age'].touched) { <span style="color:red"> Min 18</span> }
        </div>
        <div>
          <label>Website: <input formControlName="website" /></label>
          @if (f['website'].errors?.['pattern'] && f['website'].touched) { <span style="color:red"> Must start with http(s)://</span> }
        </div>
      </form>
    </section>
  `,
})
class BuiltInValidatorsComponent {
  form = new FormGroup({
    username: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]),
    email:    new FormControl('', [Validators.required, Validators.email]),
    age:      new FormControl('', [Validators.required, Validators.min(18), Validators.max(120)]),
    website:  new FormControl('', [Validators.pattern('https?://.+')]),
  });

  get f() { return this.form.controls; }
}

// SOLUTION 2: Custom validators
const noSpacesValidator: ValidatorFn = (ctrl: AbstractControl): ValidationErrors | null =>
  ctrl.value?.includes(' ') ? { noSpaces: true } : null;

const strongPasswordValidator: ValidatorFn = (ctrl: AbstractControl): ValidationErrors | null => {
  const v: string = ctrl.value ?? '';
  const errors: ValidationErrors = {};
  if (v.length < 8)         errors['minLength'] = true;
  if (!/[A-Z]/.test(v))     errors['noUppercase'] = true;
  if (!/[a-z]/.test(v))     errors['noLowercase'] = true;
  if (!/[0-9]/.test(v))     errors['noDigit'] = true;
  return Object.keys(errors).length ? errors : null;
};

@Component({
  selector: 'app-custom-validator',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Custom Validators</h3>
      <label>Username (no spaces):
        <input [formControl]="usernameCtrl" />
      </label>
      @if (usernameCtrl.errors?.['noSpaces'] && usernameCtrl.touched) {
        <span style="color:red"> No spaces allowed</span>
      }<br /><br />
      <label>Password (strong):
        <input [formControl]="pwCtrl" type="password" />
      </label>
      @if (pwCtrl.touched) {
        @if (pwCtrl.errors?.['minLength'])   { <div style="color:red">Min 8 chars</div> }
        @if (pwCtrl.errors?.['noUppercase']) { <div style="color:red">Needs uppercase</div> }
        @if (pwCtrl.errors?.['noLowercase']) { <div style="color:red">Needs lowercase</div> }
        @if (pwCtrl.errors?.['noDigit'])     { <div style="color:red">Needs a digit</div> }
      }
    </section>
  `,
})
class CustomValidatorComponent {
  usernameCtrl = new FormControl('', noSpacesValidator);
  pwCtrl       = new FormControl('', strongPasswordValidator);
}

// SOLUTION 3: Cross-field validator
const passwordMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const pw  = group.get('password')?.value;
  const cpw = group.get('confirmPassword')?.value;
  return pw && cpw && pw !== cpw ? { passwordMismatch: true } : null;
};

@Component({
  selector: 'app-cross-field',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Cross-Field Validator (Password Match)</h3>
      <form [formGroup]="form">
        <label>Password: <input formControlName="password" type="password" /></label><br /><br />
        <label>Confirm:  <input formControlName="confirmPassword" type="password" /></label>
        @if (form.errors?.['passwordMismatch'] && form.controls['confirmPassword'].dirty) {
          <p style="color:red">Passwords do not match!</p>
        }
      </form>
    </section>
  `,
})
class CrossFieldValidatorComponent {
  form = new FormGroup({
    password:        new FormControl('', Validators.required),
    confirmPassword: new FormControl('', Validators.required),
  }, { validators: passwordMatchValidator });
}

// SOLUTION 4: Async validator
const usernameExistsValidator: AsyncValidatorFn = (ctrl: AbstractControl) =>
  of(ctrl.value).pipe(
    delay(800),
    map(v => ['admin', 'john'].includes(v) ? { usernameTaken: true } : null)
  );

@Component({
  selector: 'app-async-validator',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Async Validator (username check)</h3>
      <label>Username: <input [formControl]="usernameCtrl" /></label>
      @if (usernameCtrl.pending) { <span> Checking...</span> }
      @if (usernameCtrl.errors?.['usernameTaken'] && usernameCtrl.dirty) {
        <span style="color:red"> Username taken! (try "admin" or "john")</span>
      }
      @if (usernameCtrl.valid && !usernameCtrl.pending) {
        <span style="color:green"> Available!</span>
      }
    </section>
  `,
})
class AsyncValidatorComponent {
  usernameCtrl = new FormControl('', { asyncValidators: usernameExistsValidator, updateOn: 'blur' });
}

// SOLUTION 5: Reusable ValidationMessagesComponent
@Component({
  selector: 'app-validation-messages',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (control && control.invalid && control.touched) {
      <div style="color:red; font-size:0.85em;">
        @if (control.errors?.['required'])  { <div>{{ fieldName }} is required.</div> }
        @if (control.errors?.['email'])     { <div>{{ fieldName }} must be a valid email.</div> }
        @if (control.errors?.['minlength']) { <div>{{ fieldName }} is too short.</div> }
        @if (control.errors?.['maxlength']) { <div>{{ fieldName }} is too long.</div> }
        @if (control.errors?.['min'])       { <div>{{ fieldName }} value too small.</div> }
        @if (control.errors?.['max'])       { <div>{{ fieldName }} value too large.</div> }
      </div>
    }
  `,
})
class ValidationMessagesComponent {
  @Input() control: AbstractControl | null = null;
  @Input() fieldName = 'Field';
}

@Component({
  selector: 'app-validation-messages-demo',
  standalone: true,
  imports: [ReactiveFormsModule, ValidationMessagesComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Reusable Validation Messages</h3>
      <form [formGroup]="form">
        <label>Email: <input formControlName="email" type="email" /></label>
        <app-validation-messages [control]="form.controls.email" fieldName="Email" />
        <br />
        <label>Username: <input formControlName="username" /></label>
        <app-validation-messages [control]="form.controls.username" fieldName="Username" />
      </form>
    </section>
  `,
})
class ValidationMessagesDemoComponent {
  form = new FormGroup({
    email:    new FormControl('', [Validators.required, Validators.email]),
    username: new FormControl('', [Validators.required, Validators.minLength(3)]),
  });
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [BuiltInValidatorsComponent, CustomValidatorComponent, CrossFieldValidatorComponent,
            AsyncValidatorComponent, ValidationMessagesDemoComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 4.3 — Form Validation</h1>
      <app-builtin-validators /><hr />
      <app-custom-validator /><hr />
      <app-cross-field /><hr />
      <app-async-validator /><hr />
      <app-validation-messages-demo />
    </div>
  `,
})
export class AppComponent {}
