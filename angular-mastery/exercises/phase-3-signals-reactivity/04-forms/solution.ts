import { Component, OnInit } from '@angular/core';
import {
  FormControl, FormGroup, FormArray, FormBuilder,
  ReactiveFormsModule, Validators, ValidatorFn,
  AbstractControl, AsyncValidatorFn,
} from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

// ============================================================
// Solution 3.4 — Reactive Forms
// ============================================================

// ---- Custom validators ----
const noWhitespace: ValidatorFn = (ctrl: AbstractControl) =>
  /\s/.test(ctrl.value ?? '') ? { whitespace: true } : null;

const checkUsernameAvailable: AsyncValidatorFn = (ctrl: AbstractControl): Observable<{ taken: true } | null> =>
  timer(500).pipe(map(() => ctrl.value === 'admin' ? { taken: true } : null));

const passwordsMatch: ValidatorFn = (group: AbstractControl) => {
  const pw  = (group as FormGroup).get('password')?.value;
  const cpw = (group as FormGroup).get('confirmPassword')?.value;
  return pw && cpw && pw !== cpw ? { mismatch: true } : null;
};

function err(ctrl: AbstractControl | null): string {
  if (!ctrl || ctrl.valid || ctrl.pristine) return '';
  if (ctrl.errors?.['required'])   return 'This field is required.';
  if (ctrl.errors?.['email'])      return 'Must be a valid email.';
  if (ctrl.errors?.['minlength'])  return `Min length: ${ctrl.errors['minlength'].requiredLength}.`;
  if (ctrl.errors?.['whitespace']) return 'No spaces allowed.';
  if (ctrl.errors?.['taken'])      return 'Username "admin" is taken.';
  return 'Invalid.';
}

// SOLUTION 1: LoginFormComponent
@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()"
          style="display: flex; flex-direction: column; gap: 12px; max-width: 340px;">
      <div>
        <input formControlName="email" placeholder="Email"
               style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ccc; box-sizing: border-box;" />
        @if (errMsg('email')) { <small style="color: red;">{{ errMsg('email') }}</small> }
      </div>
      <div>
        <input formControlName="password" type="password" placeholder="Password"
               style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ccc; box-sizing: border-box;" />
        @if (errMsg('password')) { <small style="color: red;">{{ errMsg('password') }}</small> }
      </div>
      <button type="submit" [disabled]="form.invalid"
              style="padding: 8px 16px; background: #3498db; color: white;
                     border: none; border-radius: 4px; cursor: pointer; opacity: 1;"
              [style.opacity]="form.invalid ? '0.5' : '1'">
        Login
      </button>
      @if (submitted) {
        <p style="color: green; margin: 0;">✅ Form submitted!</p>
      }
    </form>
  `,
})
class LoginFormComponent {
  form = new FormGroup({
    email:    new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
  });
  submitted = false;
  errMsg(name: string) { return err(this.form.get(name)); }
  submit() { if (this.form.valid) this.submitted = true; }
}

// SOLUTION 2: RegistrationFormComponent
@Component({
  selector: 'app-registration-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()"
          style="display: flex; flex-direction: column; gap: 10px; max-width: 360px;">
      @for (f of fields; track f.name) {
        <div>
          <input [formControlName]="f.name" [type]="f.type" [placeholder]="f.label"
                 style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ccc; box-sizing: border-box;" />
          @if (errMsg(f.name)) { <small style="color: red;">{{ errMsg(f.name) }}</small> }
        </div>
      }
      @if (form.errors?.['mismatch'] && form.get('confirmPassword')?.dirty) {
        <small style="color: red;">Passwords do not match.</small>
      }
      <button type="submit" [disabled]="form.invalid"
              [style.opacity]="form.invalid ? '0.5' : '1'"
              style="padding: 8px 16px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Register
      </button>
      @if (submitted) { <p style="color: green; margin: 0;">✅ Registered!</p> }
    </form>
  `,
})
class RegistrationFormComponent {
  form = new FormGroup({
    username:        new FormControl('', [Validators.required, Validators.minLength(3)]),
    email:           new FormControl('', [Validators.required, Validators.email]),
    password:        new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl('', [Validators.required]),
  }, { validators: passwordsMatch });

  fields = [
    { name: 'username', type: 'text',     label: 'Username' },
    { name: 'email',    type: 'email',    label: 'Email'    },
    { name: 'password', type: 'password', label: 'Password' },
    { name: 'confirmPassword', type: 'password', label: 'Confirm Password' },
  ];
  submitted = false;
  errMsg(name: string) { return err(this.form.get(name)); }
  submit() { if (this.form.valid) this.submitted = true; }
}

// SOLUTION 3: DynamicFormArrayComponent
@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <div formArrayName="skills" style="display: flex; flex-direction: column; gap: 8px;">
        @for (ctrl of skills.controls; track $index; let i = $index) {
          <div [formGroupName]="i" style="display: flex; gap: 8px; align-items: center;">
            <input formControlName="name" placeholder="Skill name"
                   style="flex: 1; padding: 6px 10px; border-radius: 4px; border: 1px solid #ccc;" />
            <select formControlName="level"
                    style="padding: 6px 8px; border-radius: 4px; border: 1px solid #ccc;">
              <option value="junior">Junior</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
            </select>
            <button type="button" (click)="removeSkill(i)"
                    style="background: #e74c3c; color: white; border: none;
                           border-radius: 4px; padding: 4px 10px; cursor: pointer;">✕</button>
          </div>
        }
      </div>
    </form>
    <button type="button" (click)="addSkill()"
            style="margin-top: 8px; padding: 6px 14px; background: #27ae60; color: white;
                   border: none; border-radius: 4px; cursor: pointer;">
      + Add Skill
    </button>
    <pre style="margin-top: 10px; font-size: 12px; background: #f8f9fa; padding: 10px; border-radius: 4px;">{{ form.value | json }}</pre>
  `,
})
class DynamicFormArrayComponent {
  private fb = new FormBuilder();
  form = this.fb.group({ skills: this.fb.array([this.newSkill()]) });

  get skills() { return this.form.get('skills') as FormArray; }

  newSkill() {
    return this.fb.group({ name: ['', Validators.required], level: ['junior'] });
  }
  addSkill()        { this.skills.push(this.newSkill()); }
  removeSkill(i: number) { this.skills.removeAt(i); }
}

// SOLUTION 4: CustomValidatorComponent
@Component({
  selector: 'app-custom-validator',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div style="max-width: 320px;">
      <input [formControl]="username" placeholder="Pick a username"
             style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ccc; box-sizing: border-box;" />
      <div style="margin-top: 6px; font-size: 13px;">
        @if (username.pending) { <span style="color: gray;">Checking…</span> }
        @else if (username.valid && username.dirty) { <span style="color: green;">✅ Available!</span> }
        @else if (username.errors?.['required']) { <span style="color: red;">Required.</span> }
        @else if (username.errors?.['whitespace']) { <span style="color: red;">No spaces allowed.</span> }
        @else if (username.errors?.['taken']) { <span style="color: red;">"admin" is taken.</span> }
      </div>
    </div>
  `,
})
class CustomValidatorComponent {
  username = new FormControl(
    '',
    [Validators.required, noWhitespace],
    [checkUsernameAvailable],
  );
}

// SOLUTION 5: ValueChangesComponent
@Component({
  selector: 'app-value-changes',
  standalone: true,
  imports: [ReactiveFormsModule, AsyncPipe],
  template: `
    <form [formGroup]="form" style="display: flex; gap: 12px; margin-bottom: 12px;">
      <label>Width: <input type="number" formControlName="width" style="width: 70px; padding: 6px; border-radius: 4px; border: 1px solid #ccc;" /></label>
      <label>Height: <input type="number" formControlName="height" style="width: 70px; padding: 6px; border-radius: 4px; border: 1px solid #ccc;" /></label>
    </form>
    @if (derived$ | async; as d) {
      <div style="background: #f0f4ff; padding: 12px; border-radius: 6px; display: flex; gap: 20px;">
        <span>Area: <strong>{{ d.area }}</strong></span>
        <span>Perimeter: <strong>{{ d.perimeter }}</strong></span>
        <span>Diagonal: <strong>{{ d.diagonal }}</strong></span>
      </div>
    }
  `,
})
class ValueChangesComponent {
  form = new FormGroup({
    width:  new FormControl(10, Validators.required),
    height: new FormControl(5,  Validators.required),
  });

  derived$ = this.form.valueChanges.pipe(
    map(({ width, height }) => {
      const w = Number(width) || 0, h = Number(height) || 0;
      return {
        area:      w * h,
        perimeter: 2 * (w + h),
        diagonal:  Math.sqrt(w * w + h * h).toFixed(2),
      };
    }),
  );
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LoginFormComponent, RegistrationFormComponent, DynamicFormArrayComponent, CustomValidatorComponent, ValueChangesComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <h1>Solution 3.4 — Reactive Forms</h1>

      <h2>1. Login Form (basic validation)</h2>
      <app-login-form />
      <hr />

      <h2>2. Registration (cross-field validator)</h2>
      <app-registration-form />
      <hr />

      <h2>3. Dynamic FormArray (skills)</h2>
      <app-dynamic-form />
      <hr />

      <h2>4. Custom Validators (sync + async)</h2>
      <app-custom-validator />
      <hr />

      <h2>5. valueChanges → derived values</h2>
      <app-value-changes />
    </div>
  `,
})
export class AppComponent {}
