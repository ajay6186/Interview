import { Component, OnInit, inject, InjectionToken } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, FormBuilder, Validators, AbstractControl, ValidationErrors, ValidatorFn, AsyncValidatorFn, NonNullableFormBuilder } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Observable, of, timer, switchMap, map, delay } from 'rxjs';

// ============================================================
// Examples 4.3 — Form Validation (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ────────────────────────────────────────────

// 1. Validators.required
@Component({
  selector: 'ex-01', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Required field" />
    @if (ctrl.invalid && ctrl.touched) { <small style="color:red">Required.</small> }
  `
})
class Ex01 { ctrl = new FormControl('', Validators.required); }

// 2. Validators.minLength
@Component({
  selector: 'ex-02', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Min 4 chars" />
    @if (ctrl.errors?.['minlength'] && ctrl.touched) {
      <small style="color:red">Min {{ ctrl.errors?.['minlength'].requiredLength }} characters.</small>
    }
  `
})
class Ex02 { ctrl = new FormControl('', Validators.minLength(4)); }

// 3. Validators.maxLength
@Component({
  selector: 'ex-03', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Max 10 chars" />
    <small>{{ ctrl.value?.length ?? 0 }} / 10</small>
    @if (ctrl.errors?.['maxlength']) { <small style="color:red">Too long.</small> }
  `
})
class Ex03 { ctrl = new FormControl('', Validators.maxLength(10)); }

// 4. Validators.email
@Component({
  selector: 'ex-04', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Email" />
    @if (ctrl.errors?.['email'] && ctrl.touched) { <small style="color:red">Invalid email.</small> }
    @if (ctrl.valid && ctrl.value) { <small style="color:green">Valid!</small> }
  `
})
class Ex04 { ctrl = new FormControl('', Validators.email); }

// 5. Validators.pattern
@Component({
  selector: 'ex-05', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Hex color (#abc or #aabbcc)" />
    @if (ctrl.errors?.['pattern'] && ctrl.touched) { <small style="color:red">Invalid hex color.</small> }
  `
})
class Ex05 { ctrl = new FormControl('', Validators.pattern(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)); }

// 6. Validators.min (number)
@Component({
  selector: 'ex-06', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input type="number" [formControl]="ctrl" placeholder="Min 18" />
    @if (ctrl.errors?.['min'] && ctrl.touched) { <small style="color:red">Must be at least 18.</small> }
  `
})
class Ex06 { ctrl = new FormControl<number | null>(null, Validators.min(18)); }

// 7. Validators.max (number)
@Component({
  selector: 'ex-07', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input type="number" [formControl]="ctrl" placeholder="Max 100" />
    @if (ctrl.errors?.['max'] && ctrl.touched) { <small style="color:red">Max 100 allowed.</small> }
  `
})
class Ex07 { ctrl = new FormControl<number | null>(null, Validators.max(100)); }

// 8. Validators.nullValidator
@Component({
  selector: 'ex-08', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Always valid (nullValidator)" />
    <p>Valid: {{ ctrl.valid }}</p>
  `
})
class Ex08 { ctrl = new FormControl('', Validators.nullValidator); }

// 9. Validators.compose([])
@Component({
  selector: 'ex-09', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Required + min 5" />
    <p>Errors: {{ ctrl.errors | json }}</p>
  `
})
class Ex09 {
  ctrl = new FormControl('', Validators.compose([Validators.required, Validators.minLength(5)]));
}

// 10. Errors object access
@Component({
  selector: 'ex-10', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Type..." />
    <pre>{{ ctrl.errors | json }}</pre>
  `
})
class Ex10 {
  ctrl = new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(8)]);
}

// 11. hasError() check
@Component({
  selector: 'ex-11', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Email" />
    <p>hasError('required'): {{ ctrl.hasError('required') }}</p>
    <p>hasError('email'): {{ ctrl.hasError('email') }}</p>
  `
})
class Ex11 { ctrl = new FormControl('', [Validators.required, Validators.email]); }

// 12. getError() value
@Component({
  selector: 'ex-12', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Min 6 chars" />
    @if (ctrl.getError('minlength')) {
      <small style="color:red">Need {{ ctrl.getError('minlength').requiredLength - ctrl.getError('minlength').actualLength }} more chars.</small>
    }
  `
})
class Ex12 { ctrl = new FormControl('', Validators.minLength(6)); }

// 13. valid / invalid state display
@Component({
  selector: 'ex-13', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Required email" [style.border-color]="ctrl.touched ? (ctrl.valid ? 'green' : 'red') : ''" />
    <p [style.color]="ctrl.valid ? 'green' : 'red'">{{ ctrl.valid ? 'Valid' : 'Invalid' }}</p>
  `
})
class Ex13 { ctrl = new FormControl('', [Validators.required, Validators.email]); }

// ─── INTERMEDIATE (14–26) ─────────────────────────────────────

// 14. Custom ValidatorFn — noSpaces
function noSpacesValidator(): ValidatorFn {
  return (ctrl: AbstractControl): ValidationErrors | null =>
    ctrl.value?.includes(' ') ? { noSpaces: true } : null;
}

@Component({
  selector: 'ex-14', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Username (no spaces)" />
    @if (ctrl.errors?.['noSpaces'] && ctrl.touched) { <small style="color:red">No spaces allowed.</small> }
  `
})
class Ex14 { ctrl = new FormControl('', noSpacesValidator()); }

// 15. Custom ValidatorFn — strongPassword
function strongPasswordValidator(): ValidatorFn {
  return (ctrl: AbstractControl): ValidationErrors | null => {
    const v: string = ctrl.value ?? '';
    const errors: ValidationErrors = {};
    if (v.length < 8) errors['tooShort'] = true;
    if (!/[A-Z]/.test(v)) errors['noUppercase'] = true;
    if (!/[0-9]/.test(v)) errors['noNumber'] = true;
    return Object.keys(errors).length ? errors : null;
  };
}

@Component({
  selector: 'ex-15', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input type="password" [formControl]="ctrl" placeholder="Strong password" />
    @if (ctrl.touched) {
      @if (ctrl.errors?.['tooShort']) { <p style="color:red">Min 8 characters.</p> }
      @if (ctrl.errors?.['noUppercase']) { <p style="color:red">Needs uppercase letter.</p> }
      @if (ctrl.errors?.['noNumber']) { <p style="color:red">Needs a number.</p> }
    }
  `
})
class Ex15 { ctrl = new FormControl('', strongPasswordValidator()); }

// 16. Custom ValidatorFn — noEmoji
function noEmojiValidator(): ValidatorFn {
  const emojiRe = /\p{Emoji_Presentation}/u;
  return (ctrl: AbstractControl): ValidationErrors | null =>
    emojiRe.test(ctrl.value ?? '') ? { noEmoji: true } : null;
}

@Component({
  selector: 'ex-16', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="No emojis please" />
    @if (ctrl.errors?.['noEmoji']) { <small style="color:red">Emojis not allowed.</small> }
  `
})
class Ex16 { ctrl = new FormControl('', noEmojiValidator()); }

// 17. Custom ValidatorFn — positiveNumber
function positiveNumberValidator(): ValidatorFn {
  return (ctrl: AbstractControl): ValidationErrors | null => {
    const n = Number(ctrl.value);
    return isNaN(n) || n <= 0 ? { notPositive: true } : null;
  };
}

@Component({
  selector: 'ex-17', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input type="number" [formControl]="ctrl" placeholder="Positive number" />
    @if (ctrl.errors?.['notPositive'] && ctrl.touched) { <small style="color:red">Must be a positive number.</small> }
  `
})
class Ex17 { ctrl = new FormControl<number | null>(null, positiveNumberValidator()); }

// 18. Custom ValidatorFn — dateRange
function dateRangeValidator(min: string, max: string): ValidatorFn {
  return (ctrl: AbstractControl): ValidationErrors | null => {
    if (!ctrl.value) return null;
    const d = new Date(ctrl.value);
    if (d < new Date(min)) return { tooEarly: { min } };
    if (d > new Date(max)) return { tooLate: { max } };
    return null;
  };
}

@Component({
  selector: 'ex-18', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input type="date" [formControl]="ctrl" />
    @if (ctrl.errors?.['tooEarly']) { <small style="color:red">Date too early.</small> }
    @if (ctrl.errors?.['tooLate']) { <small style="color:red">Date too late.</small> }
    @if (ctrl.valid && ctrl.value) { <small style="color:green">Date OK.</small> }
  `
})
class Ex18 { ctrl = new FormControl('', dateRangeValidator('2020-01-01', '2030-12-31')); }

// 19. Cross-field validator (passwordMatch)
function passwordMatchValidator(ctrl: AbstractControl): ValidationErrors | null {
  const pw = ctrl.get('password')?.value;
  const confirm = ctrl.get('confirm')?.value;
  return pw && confirm && pw !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'ex-19', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input formControlName="password" type="password" placeholder="Password" />
      <input formControlName="confirm" type="password" placeholder="Confirm" />
      @if (form.errors?.['passwordMismatch'] && form.get('confirm')?.touched) {
        <p style="color:red">Passwords do not match.</p>
      }
    </form>
  `
})
class Ex19 {
  form = new FormGroup({
    password: new FormControl('', Validators.required),
    confirm: new FormControl('', Validators.required),
  }, { validators: passwordMatchValidator });
}

// 20. Cross-field validator (ageCheck)
function ageCheckValidator(ctrl: AbstractControl): ValidationErrors | null {
  const dob = ctrl.get('dob')?.value;
  if (!dob) return null;
  const age = (Date.now() - new Date(dob).getTime()) / 31557600000;
  return age < 18 ? { underage: true } : null;
}

@Component({
  selector: 'ex-20', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input type="date" formControlName="dob" />
      @if (form.errors?.['underage']) { <p style="color:red">Must be 18 or older.</p> }
    </form>
  `
})
class Ex20 {
  form = new FormGroup({ dob: new FormControl('') }, { validators: ageCheckValidator });
}

// 21. Async ValidatorFn — username availability
function usernameAvailableValidator(): AsyncValidatorFn {
  const taken = ['admin', 'root', 'superuser'];
  return (ctrl: AbstractControl): Observable<ValidationErrors | null> =>
    of(taken.includes(ctrl.value?.toLowerCase()) ? { usernameTaken: true } : null).pipe(delay(500));
}

@Component({
  selector: 'ex-21', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Username" />
    @if (ctrl.pending) { <small>Checking...</small> }
    @if (ctrl.errors?.['usernameTaken']) { <small style="color:red">Username taken.</small> }
    @if (ctrl.valid && ctrl.value) { <small style="color:green">Available!</small> }
  `
})
class Ex21 { ctrl = new FormControl('', Validators.required, usernameAvailableValidator()); }

// 22. Async ValidatorFn — email check
function emailExistsValidator(): AsyncValidatorFn {
  const registered = ['alice@test.com', 'bob@test.com'];
  return (ctrl: AbstractControl): Observable<ValidationErrors | null> =>
    of(registered.includes(ctrl.value) ? { emailExists: true } : null).pipe(delay(400));
}

@Component({
  selector: 'ex-22', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Email (try alice@test.com)" />
    @if (ctrl.pending) { <small>Verifying...</small> }
    @if (ctrl.errors?.['emailExists']) { <small style="color:red">Email already registered.</small> }
    @if (ctrl.valid && ctrl.value) { <small style="color:green">Email available.</small> }
  `
})
class Ex22 {
  ctrl = new FormControl('', [Validators.required, Validators.email], emailExistsValidator());
}

// 23. AsyncValidatorFn with delay (timer + switchMap)
function slowValidator(): AsyncValidatorFn {
  return (ctrl: AbstractControl): Observable<ValidationErrors | null> =>
    timer(600).pipe(map(() => ctrl.value === 'invalid' ? { forbidden: true } : null));
}

@Component({
  selector: 'ex-23', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Type 'invalid' to trigger error" />
    @if (ctrl.pending) { <small>Validating...</small> }
    @if (ctrl.errors?.['forbidden']) { <small style="color:red">That value is forbidden.</small> }
  `
})
class Ex23 { ctrl = new FormControl('', null, slowValidator()); }

// 24. Validator that returns multiple errors
function complexValidator(): ValidatorFn {
  return (ctrl: AbstractControl): ValidationErrors | null => {
    const v: string = ctrl.value ?? '';
    const errors: ValidationErrors = {};
    if (!v) errors['required'] = true;
    if (v.length < 5) errors['tooShort'] = { actual: v.length, required: 5 };
    if (/[^a-zA-Z0-9_]/.test(v)) errors['invalidChars'] = true;
    return Object.keys(errors).length ? errors : null;
  };
}

@Component({
  selector: 'ex-24', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Alphanumeric, min 5" />
    @if (ctrl.touched) {
      @if (ctrl.errors?.['required']) { <p style="color:red">Required.</p> }
      @if (ctrl.errors?.['tooShort']) { <p style="color:red">Too short.</p> }
      @if (ctrl.errors?.['invalidChars']) { <p style="color:red">Alphanumeric only.</p> }
    }
  `
})
class Ex24 { ctrl = new FormControl('', complexValidator()); }

// 25. Conditional validator (required if)
@Component({
  selector: 'ex-25', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <label><input type="checkbox" formControlName="receiveNewsletter" /> Newsletter</label>
      @if (form.get('receiveNewsletter')?.value) {
        <input formControlName="newsletterEmail" placeholder="Email for newsletter*" />
        @if (form.get('newsletterEmail')?.invalid && form.get('newsletterEmail')?.touched) {
          <small style="color:red">Email required for newsletter.</small>
        }
      }
    </form>
  `
})
class Ex25 implements OnInit {
  form = new FormGroup({
    receiveNewsletter: new FormControl(false),
    newsletterEmail: new FormControl(''),
  });
  ngOnInit() {
    this.form.get('receiveNewsletter')!.valueChanges.subscribe(v => {
      const emailCtrl = this.form.get('newsletterEmail')!;
      v ? emailCtrl.setValidators([Validators.required, Validators.email]) : emailCtrl.clearValidators();
      emailCtrl.updateValueAndValidity();
    });
  }
}

// 26. Validator factory (parametrized)
function minAgeValidator(minAge: number): ValidatorFn {
  return (ctrl: AbstractControl): ValidationErrors | null => {
    if (!ctrl.value) return null;
    const age = (Date.now() - new Date(ctrl.value).getTime()) / 31557600000;
    return age < minAge ? { minAge: { required: minAge, actual: Math.floor(age) } } : null;
  };
}

@Component({
  selector: 'ex-26', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input type="date" [formControl]="ctrl" />
    @if (ctrl.errors?.['minAge'] && ctrl.touched) {
      <small style="color:red">Must be at least {{ ctrl.errors?.['minAge'].required }} years old.</small>
    }
  `
})
class Ex26 { ctrl = new FormControl('', minAgeValidator(21)); }

// ─── NESTED (27–38) ───────────────────────────────────────────

// 27. Validator on nested FormGroup
function atLeastOneContactValidator(ctrl: AbstractControl): ValidationErrors | null {
  const phone = ctrl.get('phone')?.value;
  const email = ctrl.get('email')?.value;
  return !phone && !email ? { atLeastOneContact: true } : null;
}

@Component({
  selector: 'ex-27', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <div formGroupName="contact">
        <input formControlName="phone" placeholder="Phone" />
        <input formControlName="email" placeholder="Email" />
        @if (form.get('contact')?.errors?.['atLeastOneContact']) {
          <small style="color:red">Provide at least phone or email.</small>
        }
      </div>
    </form>
  `
})
class Ex27 {
  constructor(private fb: FormBuilder) {}
  form = this.fb.group({
    contact: this.fb.group({ phone: [''], email: [''] }, { validators: atLeastOneContactValidator }),
  });
}

// 28. Validator on FormArray items
import { FormArray } from '@angular/forms';

@Component({
  selector: 'ex-28', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <div formArrayName="tags">
        @for (ctrl of tagsArray.controls; track $index; let i = $index) {
          <div>
            <input [formControlName]="i" placeholder="Tag" />
            @if (ctrl.errors?.['minlength'] && ctrl.touched) { <small style="color:red">Min 2 chars.</small> }
          </div>
        }
      </div>
      <button type="button" (click)="addTag()">+ Tag</button>
    </form>
    <p>Valid: {{ form.valid }}</p>
  `
})
class Ex28 {
  constructor(private fb: FormBuilder) {}
  form = this.fb.group({ tags: this.fb.array([this.fb.control('', [Validators.required, Validators.minLength(2)])]) });
  get tagsArray() { return this.form.get('tags') as FormArray; }
  addTag() { this.tagsArray.push(this.fb.control('', [Validators.required, Validators.minLength(2)])); }
}

// 29. Multiple async validators
function checkHandle(): AsyncValidatorFn {
  return (ctrl: AbstractControl) =>
    of(['admin', 'mod'].includes(ctrl.value) ? { reserved: true } : null).pipe(delay(300));
}
function checkLength(): AsyncValidatorFn {
  return (ctrl: AbstractControl) =>
    of(ctrl.value?.length > 20 ? { tooLong: true } : null).pipe(delay(200));
}

@Component({
  selector: 'ex-29', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Handle (async: reserved + length)" />
    @if (ctrl.pending) { <small>Checking...</small> }
    @if (ctrl.errors?.['reserved']) { <small style="color:red">Reserved name.</small> }
    @if (ctrl.errors?.['tooLong']) { <small style="color:red">Too long.</small> }
  `
})
class Ex29 {
  ctrl = new FormControl('', Validators.required, [checkHandle(), checkLength()]);
}

// 30. Validator with inject() service
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
class BlacklistService {
  blacklist = ['spam', 'hack', 'abuse'];
  isBlacklisted(val: string) { return this.blacklist.includes(val?.toLowerCase()); }
}

@Component({
  selector: 'ex-30', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Topic (no blacklisted words)" />
    @if (ctrl.errors?.['blacklisted']) { <small style="color:red">That word is not allowed.</small> }
    @if (ctrl.valid && ctrl.value) { <small style="color:green">OK!</small> }
  `
})
class Ex30 {
  private bl = inject(BlacklistService);
  ctrl = new FormControl('', (c: AbstractControl) =>
    this.bl.isBlacklisted(c.value) ? { blacklisted: true } : null
  );
}

// 31. Form with per-field error messages component
@Component({
  selector: 'field-errors', standalone: true,
  template: `
    @if (ctrl && ctrl.touched && ctrl.errors) {
      @if (ctrl.errors['required']) { <p style="color:red;margin:2px 0">Required.</p> }
      @if (ctrl.errors['email']) { <p style="color:red;margin:2px 0">Invalid email.</p> }
      @if (ctrl.errors['minlength']) { <p style="color:red;margin:2px 0">Too short.</p> }
    }
  `
})
class FieldErrors { @NgInput() ctrl: AbstractControl | null = null; }

import { Input as NgInput } from '@angular/core';

@Component({
  selector: 'ex-31', standalone: true, imports: [ReactiveFormsModule, FieldErrors],
  template: `
    <form [formGroup]="form">
      <input formControlName="email" placeholder="Email" />
      <field-errors [ctrl]="form.get('email')" />
      <input formControlName="username" placeholder="Username" />
      <field-errors [ctrl]="form.get('username')" />
    </form>
  `
})
class Ex31 {
  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    username: new FormControl('', [Validators.required, Validators.minLength(3)]),
  });
}

// 32. Validator composition
@Component({
  selector: 'ex-32', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Required + email + no spaces" />
    <p>Errors: {{ ctrl.errors | json }}</p>
  `
})
class Ex32 {
  ctrl = new FormControl('', Validators.compose([
    Validators.required,
    Validators.email,
    (c: AbstractControl) => c.value?.includes(' ') ? { noSpaces: true } : null,
  ]));
}

// 33. Cross-field + async combination
function crossFieldCheck(ctrl: AbstractControl): ValidationErrors | null {
  const pw = ctrl.get('password')?.value ?? '';
  const user = ctrl.get('username')?.value ?? '';
  return user && pw.includes(user) ? { passwordContainsUsername: true } : null;
}

@Component({
  selector: 'ex-33', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input formControlName="username" placeholder="Username" />
      <input type="password" formControlName="password" placeholder="Password" />
      @if (form.errors?.['passwordContainsUsername']) {
        <p style="color:red">Password cannot contain username.</p>
      }
    </form>
  `
})
class Ex33 {
  form = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
  }, { validators: crossFieldCheck });
}

// 34. Dynamic validator add / remove
@Component({
  selector: 'ex-34', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Input" />
    <button (click)="addRequired()">Add Required</button>
    <button (click)="removeRequired()">Remove Required</button>
    <p>Valid: {{ ctrl.valid }} | Errors: {{ ctrl.errors | json }}</p>
  `
})
class Ex34 {
  ctrl = new FormControl('');
  addRequired() { this.ctrl.addValidators(Validators.required); this.ctrl.updateValueAndValidity(); }
  removeRequired() { this.ctrl.removeValidators(Validators.required); this.ctrl.updateValueAndValidity(); }
}

// 35. Validator with real-time feedback
@Component({
  selector: 'ex-35', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input type="password" [formControl]="ctrl" placeholder="Password" />
    <div style="margin-top:4px">
      <span [style.color]="ctrl.value && ctrl.value.length >= 8 ? 'green' : 'gray'">Length OK</span> |
      <span [style.color]="hasUpper() ? 'green' : 'gray'">Uppercase</span> |
      <span [style.color]="hasNum() ? 'green' : 'gray'">Number</span> |
      <span [style.color]="hasSpecial() ? 'green' : 'gray'">Special</span>
    </div>
  `
})
class Ex35 {
  ctrl = new FormControl('');
  hasUpper() { return /[A-Z]/.test(this.ctrl.value ?? ''); }
  hasNum() { return /[0-9]/.test(this.ctrl.value ?? ''); }
  hasSpecial() { return /[^a-zA-Z0-9]/.test(this.ctrl.value ?? ''); }
}

// 36. Validator for file size
@Component({
  selector: 'ex-36', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input type="file" (change)="onFile($event)" />
    @if (error) { <p style="color:red">{{ error }}</p> }
    @if (filename) { <p style="color:green">{{ filename }} selected.</p> }
  `
})
class Ex36 {
  error = ''; filename = '';
  onFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { this.error = `File too large (${(file.size / 1024).toFixed(0)}KB). Max 1MB.`; this.filename = ''; }
    else { this.error = ''; this.filename = file.name; }
  }
}

// 37. Full form with all validator types
@Component({
  selector: 'ex-37', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submitted = true">
      <input formControlName="name" placeholder="Name*" />
      @if (f('name')?.invalid && f('name')?.touched) { <small style="color:red">Required, min 2.</small> }
      <input formControlName="email" placeholder="Email*" />
      @if (f('email')?.invalid && f('email')?.touched) { <small style="color:red">Valid email required.</small> }
      <input type="number" formControlName="age" placeholder="Age (18-120)" />
      @if (f('age')?.invalid && f('age')?.touched) { <small style="color:red">Age 18–120.</small> }
      <input type="password" formControlName="password" placeholder="Password" />
      @if (f('password')?.invalid && f('password')?.touched) { <small style="color:red">Min 8, 1 uppercase, 1 number.</small> }
      <button [disabled]="form.invalid">Submit</button>
    </form>
    @if (submitted) { <p style="color:green">All valid!</p> }
  `
})
class Ex37 {
  submitted = false;
  form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    age: new FormControl<number | null>(null, [Validators.required, Validators.min(18), Validators.max(120)]),
    password: new FormControl('', strongPasswordValidator()),
  });
  f(name: string) { return this.form.get(name); }
}

// 38. Full form — all validator types (template-driven)
@Component({
  selector: 'ex-38', standalone: true, imports: [FormsModule],
  template: `
    <form #f="ngForm" (ngSubmit)="done = f.valid">
      <input name="user" ngModel required minlength="3" maxlength="20" pattern="[a-zA-Z0-9_]+" #u="ngModel" placeholder="Username" />
      @if (u.touched && u.errors) {
        @if (u.errors['required']) { <small style="color:red">Required.</small> }
        @if (u.errors['minlength']) { <small style="color:red">Min 3.</small> }
        @if (u.errors['pattern']) { <small style="color:red">Alphanumeric only.</small> }
      }
      <input name="email" ngModel required email #e="ngModel" placeholder="Email" />
      @if (e.touched && e.errors?.['email']) { <small style="color:red">Bad email.</small> }
      <button [disabled]="f.invalid">Go</button>
    </form>
    @if (done) { <p style="color:green">Form valid!</p> }
  `
})
class Ex38 { done = false; }

// ─── ADVANCED (39–50) ─────────────────────────────────────────

// 39. Type-safe custom validator
function typedRangeValidator<T extends number>(min: T, max: T): ValidatorFn {
  return (ctrl: AbstractControl): ValidationErrors | null => {
    const v = Number(ctrl.value);
    if (isNaN(v)) return { notANumber: true };
    if (v < min) return { rangeMin: { min, actual: v } };
    if (v > max) return { rangeMax: { max, actual: v } };
    return null;
  };
}

@Component({
  selector: 'ex-39', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input type="number" [formControl]="ctrl" placeholder="1–10" />
    @if (ctrl.errors?.['rangeMin']) { <small style="color:red">Min {{ ctrl.errors['rangeMin'].min }}.</small> }
    @if (ctrl.errors?.['rangeMax']) { <small style="color:red">Max {{ ctrl.errors['rangeMax'].max }}.</small> }
    @if (ctrl.valid && ctrl.value !== null) { <small style="color:green">In range.</small> }
  `
})
class Ex39 { ctrl = new FormControl<number | null>(null, typedRangeValidator(1, 10)); }

// 40. Validator with RxJS (Observable return)
function rxjsValidator(): AsyncValidatorFn {
  return (ctrl: AbstractControl): Observable<ValidationErrors | null> =>
    timer(300).pipe(map(() => ctrl.value?.startsWith('ng') ? null : { mustStartWithNg: true }));
}

@Component({
  selector: 'ex-40', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Must start with 'ng'" />
    @if (ctrl.pending) { <small>Checking...</small> }
    @if (ctrl.errors?.['mustStartWithNg']) { <small style="color:red">Must start with "ng".</small> }
    @if (ctrl.valid && ctrl.value) { <small style="color:green">Valid!</small> }
  `
})
class Ex40 { ctrl = new FormControl('', null, rxjsValidator()); }

// 41. Async validator with retry
import { catchError, retry } from 'rxjs/operators';

function retryingValidator(): AsyncValidatorFn {
  return (ctrl: AbstractControl): Observable<ValidationErrors | null> =>
    of(ctrl.value === 'error' ? null : { notFound: true }).pipe(
      delay(300),
      retry(2),
      catchError(() => of({ serverError: true }))
    );
}

@Component({
  selector: 'ex-41', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Type 'error' for valid" />
    @if (ctrl.pending) { <small>Retrying check...</small> }
    @if (ctrl.errors?.['notFound']) { <small style="color:red">Not found.</small> }
    @if (ctrl.valid && ctrl.value) { <small style="color:green">Found!</small> }
  `
})
class Ex41 { ctrl = new FormControl('', null, retryingValidator()); }

// 42. Validator using InjectionToken config
interface ValidationConfig { minPasswordLength: number; allowedDomains: string[]; }
const VALIDATION_CONFIG = new InjectionToken<ValidationConfig>('VALIDATION_CONFIG', {
  providedIn: 'root',
  factory: () => ({ minPasswordLength: 8, allowedDomains: ['company.com', 'org.com'] }),
});

@Component({
  selector: 'ex-42', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="emailCtrl" placeholder="company.com email" />
    @if (emailCtrl.errors?.['domainNotAllowed']) { <small style="color:red">Use a company.com or org.com email.</small> }
    @if (emailCtrl.valid && emailCtrl.value) { <small style="color:green">Allowed domain!</small> }
  `
})
class Ex42 {
  private config = inject(VALIDATION_CONFIG);
  emailCtrl = new FormControl('', [
    Validators.required,
    Validators.email,
    (c: AbstractControl) => {
      const domain = c.value?.split('@')[1];
      return domain && !this.config.allowedDomains.includes(domain) ? { domainNotAllowed: true } : null;
    }
  ]);
}

// 43. Validator for complex business rule
function ibanValidator(): ValidatorFn {
  return (ctrl: AbstractControl): ValidationErrors | null => {
    const v: string = (ctrl.value ?? '').replace(/\s/g, '').toUpperCase();
    if (!v) return null;
    if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,}$/.test(v)) return { invalidIban: true };
    return null;
  };
}

@Component({
  selector: 'ex-43', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="IBAN (e.g. GB29NWBK60161331926819)" />
    @if (ctrl.errors?.['invalidIban'] && ctrl.touched) { <small style="color:red">Invalid IBAN format.</small> }
    @if (ctrl.valid && ctrl.value) { <small style="color:green">IBAN format OK.</small> }
  `
})
class Ex43 { ctrl = new FormControl('', ibanValidator()); }

// 44. Validator that modifies other fields
@Component({
  selector: 'ex-44', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input formControlName="username" placeholder="Username (will auto-fill slug)" />
      <input formControlName="slug" placeholder="Slug (auto-generated)" />
    </form>
    <pre>{{ form.value | json }}</pre>
  `
})
class Ex44 implements OnInit {
  form = new FormGroup({
    username: new FormControl(''),
    slug: new FormControl({ value: '', disabled: true }),
  });
  ngOnInit() {
    this.form.get('username')!.valueChanges.subscribe(v => {
      this.form.get('slug')!.setValue(v?.toLowerCase().replace(/\s+/g, '-') ?? '');
    });
  }
}

// 45. Server-side validation integration
function mockServerValidate(email: string): Observable<ValidationErrors | null> {
  const serverErrors: Record<string, ValidationErrors> = {
    'banned@evil.com': { banned: true },
    'duplicate@test.com': { duplicate: true },
  };
  return of(serverErrors[email] ?? null).pipe(delay(500));
}

@Component({
  selector: 'ex-45', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Email (try banned@evil.com)" />
    @if (ctrl.pending) { <small>Validating with server...</small> }
    @if (ctrl.errors?.['banned']) { <small style="color:red">This email is banned.</small> }
    @if (ctrl.errors?.['duplicate']) { <small style="color:red">Email already registered.</small> }
    @if (ctrl.valid && ctrl.value) { <small style="color:green">Email accepted.</small> }
  `
})
class Ex45 {
  ctrl = new FormControl('', [Validators.required, Validators.email],
    (c: AbstractControl) => mockServerValidate(c.value));
}

// 46. Validator with throttle
@Component({
  selector: 'ex-46', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Throttled async check (500ms)" />
    @if (ctrl.pending) { <small>Checking...</small> }
    @if (ctrl.errors?.['taken']) { <small style="color:red">Already taken.</small> }
    @if (ctrl.valid && ctrl.value) { <small style="color:green">Free!</small> }
  `
})
class Ex46 {
  ctrl = new FormControl('', Validators.required,
    (c: AbstractControl): Observable<ValidationErrors | null> =>
      timer(500).pipe(map(() => ['taken1', 'taken2'].includes(c.value) ? { taken: true } : null))
  );
}

// 47. Reusable error message directive
import { Directive, Input as DirInput, HostBinding } from '@angular/core';

@Directive({ selector: '[errorMsg]', standalone: true })
class ErrorMsgDirective {
  @DirInput('errorMsg') set ctrl(c: AbstractControl | null) { this._ctrl = c; }
  private _ctrl: AbstractControl | null = null;
  @HostBinding('style.color') get color() { return 'red'; }
  @HostBinding('style.display') get display() { return this._ctrl?.touched && this._ctrl?.invalid ? 'block' : 'none'; }
}

@Component({
  selector: 'ex-47', standalone: true, imports: [ReactiveFormsModule, ErrorMsgDirective],
  template: `
    <input [formControl]="ctrl" placeholder="Required" />
    <small [errorMsg]="ctrl">This field is required.</small>
  `
})
class Ex47 { ctrl = new FormControl('', Validators.required); }

// 48. Validator as injectable service
@Injectable({ providedIn: 'root' })
class PasswordValidatorService {
  validate(ctrl: AbstractControl): ValidationErrors | null {
    const v: string = ctrl.value ?? '';
    if (!v) return { required: true };
    if (v.length < 8) return { minlength: { requiredLength: 8, actualLength: v.length } };
    if (!/[A-Z]/.test(v)) return { noUppercase: true };
    if (!/[0-9]/.test(v)) return { noNumber: true };
    return null;
  }
}

@Component({
  selector: 'ex-48', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input type="password" [formControl]="ctrl" placeholder="Password" />
    @if (ctrl.touched) {
      @if (ctrl.errors?.['required']) { <p style="color:red">Required.</p> }
      @if (ctrl.errors?.['minlength']) { <p style="color:red">Too short.</p> }
      @if (ctrl.errors?.['noUppercase']) { <p style="color:red">Needs uppercase.</p> }
      @if (ctrl.errors?.['noNumber']) { <p style="color:red">Needs number.</p> }
    }
  `
})
class Ex48 {
  private svc = inject(PasswordValidatorService);
  ctrl = new FormControl('', (c) => this.svc.validate(c));
}

// 49. Custom async validator with cache
const validationCache = new Map<string, ValidationErrors | null>();

function cachedAsyncValidator(): AsyncValidatorFn {
  return (ctrl: AbstractControl): Observable<ValidationErrors | null> => {
    const val = ctrl.value;
    if (validationCache.has(val)) return of(validationCache.get(val)!);
    return of(['used1', 'used2'].includes(val) ? { used: true } : null).pipe(
      delay(600),
      map(result => { validationCache.set(val, result); return result; })
    );
  };
}

@Component({
  selector: 'ex-49', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Handle (try used1 or used2)" />
    @if (ctrl.pending) { <small>Checking (cached)...</small> }
    @if (ctrl.errors?.['used']) { <small style="color:red">Handle in use.</small> }
    @if (ctrl.valid && ctrl.value) { <small style="color:green">Handle free!</small> }
  `
})
class Ex49 { ctrl = new FormControl('', Validators.required, cachedAsyncValidator()); }

// 50. Full signup form with all validation patterns
@Component({
  selector: 'ex-50', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div>
        <input formControlName="username" placeholder="Username" />
        @if (f('username')?.touched) {
          @if (f('username')?.errors?.['required']) { <small style="color:red">Required.</small> }
          @if (f('username')?.errors?.['minlength']) { <small style="color:red">Min 3 chars.</small> }
          @if (f('username')?.errors?.['noSpaces']) { <small style="color:red">No spaces.</small> }
        }
        @if (f('username')?.pending) { <small>Checking availability...</small> }
        @if (f('username')?.errors?.['usernameTaken']) { <small style="color:red">Taken.</small> }
      </div>
      <div>
        <input formControlName="email" placeholder="Email" />
        @if (f('email')?.touched && f('email')?.invalid) { <small style="color:red">Valid email required.</small> }
      </div>
      <div>
        <input type="password" formControlName="password" placeholder="Password" />
        @if (f('password')?.touched) {
          @if (f('password')?.errors?.['tooShort']) { <small style="color:red">Min 8 chars.</small> }
          @if (f('password')?.errors?.['noUppercase']) { <small style="color:red">Needs uppercase.</small> }
          @if (f('password')?.errors?.['noNumber']) { <small style="color:red">Needs number.</small> }
        }
      </div>
      <div>
        <input type="password" formControlName="confirm" placeholder="Confirm Password" />
        @if (form.errors?.['passwordMismatch'] && f('confirm')?.touched) {
          <small style="color:red">Passwords do not match.</small>
        }
      </div>
      <div>
        <input type="number" formControlName="age" placeholder="Age" />
        @if (f('age')?.touched && f('age')?.invalid) { <small style="color:red">Must be 18–120.</small> }
      </div>
      <button type="submit" [disabled]="form.invalid || form.pending">Register</button>
    </form>
    @if (done) { <p style="color:green">Registered!</p> }
  `
})
class Ex50 {
  done = false;
  form = new FormGroup({
    username: new FormControl('',
      [Validators.required, Validators.minLength(3), noSpacesValidator()],
      usernameAvailableValidator()
    ),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', strongPasswordValidator()),
    confirm: new FormControl('', Validators.required),
    age: new FormControl<number | null>(null, [Validators.required, Validators.min(18), Validators.max(120)]),
  }, { validators: passwordMatchValidator });
  f(name: string) { return this.form.get(name); }
  onSubmit() { if (this.form.valid) { this.done = true; this.form.reset(); } }
}

// ─── App Root ─────────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    Ex01, Ex02, Ex03, Ex04, Ex05, Ex06, Ex07, Ex08, Ex09, Ex10,
    Ex11, Ex12, Ex13, Ex14, Ex15, Ex16, Ex17, Ex18, Ex19, Ex20,
    Ex21, Ex22, Ex23, Ex24, Ex25, Ex26, Ex27, Ex28, Ex29, Ex30,
    Ex31, Ex32, Ex33, Ex34, Ex35, Ex36, Ex37, Ex38, Ex39, Ex40,
    Ex41, Ex42, Ex43, Ex44, Ex45, Ex46, Ex47, Ex48, Ex49, Ex50,
  ],
  template: `
    <div style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:20px">
      <h1>Examples 4.3 — Form Validation</h1>
      <h4>1. Validators.required</h4><ex-01 /><hr />
      <h4>2. Validators.minLength</h4><ex-02 /><hr />
      <h4>3. Validators.maxLength</h4><ex-03 /><hr />
      <h4>4. Validators.email</h4><ex-04 /><hr />
      <h4>5. Validators.pattern</h4><ex-05 /><hr />
      <h4>6. Validators.min (number)</h4><ex-06 /><hr />
      <h4>7. Validators.max (number)</h4><ex-07 /><hr />
      <h4>8. Validators.nullValidator</h4><ex-08 /><hr />
      <h4>9. Validators.compose([])</h4><ex-09 /><hr />
      <h4>10. Errors object access</h4><ex-10 /><hr />
      <h4>11. hasError() check</h4><ex-11 /><hr />
      <h4>12. getError() value</h4><ex-12 /><hr />
      <h4>13. valid / invalid state display</h4><ex-13 /><hr />
      <h4>14. Custom ValidatorFn — noSpaces</h4><ex-14 /><hr />
      <h4>15. Custom ValidatorFn — strongPassword</h4><ex-15 /><hr />
      <h4>16. Custom ValidatorFn — noEmoji</h4><ex-16 /><hr />
      <h4>17. Custom ValidatorFn — positiveNumber</h4><ex-17 /><hr />
      <h4>18. Custom ValidatorFn — dateRange</h4><ex-18 /><hr />
      <h4>19. Cross-field validator (passwordMatch)</h4><ex-19 /><hr />
      <h4>20. Cross-field validator (ageCheck)</h4><ex-20 /><hr />
      <h4>21. Async ValidatorFn — username availability</h4><ex-21 /><hr />
      <h4>22. Async ValidatorFn — email check</h4><ex-22 /><hr />
      <h4>23. AsyncValidatorFn with delay</h4><ex-23 /><hr />
      <h4>24. Validator that returns multiple errors</h4><ex-24 /><hr />
      <h4>25. Conditional validator (required if)</h4><ex-25 /><hr />
      <h4>26. Validator factory (parametrized)</h4><ex-26 /><hr />
      <h4>27. Validator on nested FormGroup</h4><ex-27 /><hr />
      <h4>28. Validator on FormArray items</h4><ex-28 /><hr />
      <h4>29. Multiple async validators</h4><ex-29 /><hr />
      <h4>30. Validator with inject() service</h4><ex-30 /><hr />
      <h4>31. Form with per-field error messages component</h4><ex-31 /><hr />
      <h4>32. Validator composition</h4><ex-32 /><hr />
      <h4>33. Cross-field + async combination</h4><ex-33 /><hr />
      <h4>34. Dynamic validator add / remove</h4><ex-34 /><hr />
      <h4>35. Validator with real-time feedback</h4><ex-35 /><hr />
      <h4>36. Validator for file size</h4><ex-36 /><hr />
      <h4>37. Full form with all validator types (reactive)</h4><ex-37 /><hr />
      <h4>38. Full form with all validator types (template-driven)</h4><ex-38 /><hr />
      <h4>39. Type-safe custom validator</h4><ex-39 /><hr />
      <h4>40. Validator with RxJS (Observable return)</h4><ex-40 /><hr />
      <h4>41. Async validator with retry</h4><ex-41 /><hr />
      <h4>42. Validator using InjectionToken config</h4><ex-42 /><hr />
      <h4>43. Validator for complex business rule (IBAN)</h4><ex-43 /><hr />
      <h4>44. Validator that modifies other fields</h4><ex-44 /><hr />
      <h4>45. Server-side validation integration</h4><ex-45 /><hr />
      <h4>46. Validator with throttle</h4><ex-46 /><hr />
      <h4>47. Reusable error message directive</h4><ex-47 /><hr />
      <h4>48. Validator as injectable service</h4><ex-48 /><hr />
      <h4>49. Custom async validator with cache</h4><ex-49 /><hr />
      <h4>50. Full signup form with all validation patterns</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
