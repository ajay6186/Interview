import {
  Component, signal, computed, inject, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule, ReactiveFormsModule,
  FormControl, FormGroup, FormBuilder, FormArray,
  Validators, AbstractControl, ValidationErrors, AsyncValidatorFn,
  NG_VALUE_ACCESSOR, ControlValueAccessor
} from '@angular/forms';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { Observable, of, delay, map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// ── Ex01 – ngModel simple ───────────────────────────────────────────────────
@Component({
  selector: 'ex-01', standalone: true, imports: [FormsModule], template: `
    <input [(ngModel)]="name" placeholder="Your name">
    <p>Hello, {{ name }}!</p>
  `
})
export class Ex01 { name = ''; }

// ── Ex02 – ngModel two-way binding ───────────────────────────────────────────
@Component({
  selector: 'ex-02', standalone: true, imports: [FormsModule], template: `
    <input [(ngModel)]="value" placeholder="Type here">
    <input [(ngModel)]="value" placeholder="Mirror">
    <p>{{ value }}</p>
  `
})
export class Ex02 { value = ''; }

// ── Ex03 – ngForm template reference ────────────────────────────────────────
@Component({
  selector: 'ex-03', standalone: true, imports: [FormsModule, CommonModule], template: `
    <form #f="ngForm" (ngSubmit)="submit(f.value)">
      <input name="username" ngModel required placeholder="Username">
      <button type="submit">Submit</button>
    </form>
    <p>Valid: {{ f.valid }}</p>
    @if (result) { <pre>{{ result | json }}</pre> }
  `
})
export class Ex03 { result: unknown = null; submit(v: unknown) { this.result = v; } }

// ── Ex04 – template-driven login form ────────────────────────────────────────
@Component({
  selector: 'ex-04', standalone: true, imports: [FormsModule, CommonModule], template: `
    <form #f="ngForm" (ngSubmit)="login(f.value)">
      <input name="email" ngModel type="email" required placeholder="Email">
      <input name="password" ngModel type="password" required minlength="6" placeholder="Password">
      <button [disabled]="f.invalid">Login</button>
    </form>
    <p>{{ msg }}</p>
  `
})
export class Ex04 { msg = ''; login(v: { email: string; password: string }) { this.msg = `Welcome ${v.email}`; } }

// ── Ex05 – FormControl ───────────────────────────────────────────────────────
@Component({
  selector: 'ex-05', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <input [formControl]="ctrl" placeholder="Type…">
    <p>Value: {{ ctrl.value }}</p>
    <p>Valid: {{ ctrl.valid }}</p>
    @if (ctrl.hasError('required')) { <p style="color:red">Required!</p> }
  `
})
export class Ex05 { ctrl = new FormControl('', Validators.required); }

// ── Ex06 – FormGroup ─────────────────────────────────────────────────────────
@Component({
  selector: 'ex-06', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <input formControlName="first" placeholder="First">
      <input formControlName="last" placeholder="Last">
      <button type="submit">Save</button>
    </form>
    @if (saved) { <p>{{ saved }}</p> }
  `
})
export class Ex06 {
  form = new FormGroup({
    first: new FormControl('', Validators.required),
    last: new FormControl('', Validators.required)
  });
  saved = '';
  submit() { if (this.form.valid) this.saved = `${this.form.value.first} ${this.form.value.last}`; }
}

// ── Ex07 – FormBuilder ───────────────────────────────────────────────────────
@Component({
  selector: 'ex-07', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <input formControlName="email" placeholder="Email">
      <input formControlName="age" type="number" placeholder="Age">
      <button type="submit">Submit</button>
    </form>
    @if (result) { <pre>{{ result | json }}</pre> }
  `
})
export class Ex07 {
  fb = inject(FormBuilder);
  form = this.fb.group({ email: ['', [Validators.required, Validators.email]], age: [null] });
  result: unknown = null;
  submit() { if (this.form.valid) this.result = this.form.value; }
}

// ── Ex08 – valueChanges ──────────────────────────────────────────────────────
@Component({
  selector: 'ex-08', standalone: true, imports: [ReactiveFormsModule], template: `
    <input [formControl]="ctrl" placeholder="Type…">
    <p>Changes: {{ changes }}</p>
    <p>Latest: {{ latest }}</p>
  `
})
export class Ex08 {
  ctrl = new FormControl('');
  changes = 0;
  latest = '';
  constructor() {
    this.ctrl.valueChanges.pipe(takeUntilDestroyed()).subscribe(v => { this.changes++; this.latest = v ?? ''; });
  }
}

// ── Ex09 – statusChanges ─────────────────────────────────────────────────────
@Component({
  selector: 'ex-09', standalone: true, imports: [ReactiveFormsModule], template: `
    <input [formControl]="ctrl" placeholder="Email (required)">
    <p>Status: {{ status }}</p>
  `
})
export class Ex09 {
  ctrl = new FormControl('', [Validators.required, Validators.email]);
  status = 'INVALID';
  constructor() {
    this.ctrl.statusChanges.pipe(takeUntilDestroyed()).subscribe(s => (this.status = s));
  }
}

// ── Ex10 – Validators.required ───────────────────────────────────────────────
@Component({
  selector: 'ex-10', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <input [formControl]="ctrl" placeholder="Required field">
    @if (ctrl.touched && ctrl.hasError('required')) { <p style="color:red">This field is required.</p> }
  `
})
export class Ex10 { ctrl = new FormControl('', Validators.required); }

// ── Ex11 – minLength / maxLength ─────────────────────────────────────────────
@Component({
  selector: 'ex-11', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <input [formControl]="ctrl" placeholder="3–10 chars">
    @if (ctrl.errors?.['minlength']) { <p style="color:red">Min 3 chars</p> }
    @if (ctrl.errors?.['maxlength']) { <p style="color:red">Max 10 chars</p> }
  `
})
export class Ex11 { ctrl = new FormControl('', [Validators.minLength(3), Validators.maxLength(10)]); }

// ── Ex12 – email validator ───────────────────────────────────────────────────
@Component({
  selector: 'ex-12', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <input [formControl]="ctrl" type="email" placeholder="Email">
    @if (ctrl.dirty && ctrl.hasError('email')) { <p style="color:red">Invalid email</p> }
  `
})
export class Ex12 { ctrl = new FormControl('', Validators.email); }

// ── Ex13 – pattern validator ─────────────────────────────────────────────────
@Component({
  selector: 'ex-13', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <input [formControl]="ctrl" placeholder="Only digits">
    @if (ctrl.dirty && ctrl.hasError('pattern')) { <p style="color:red">Digits only!</p> }
  `
})
export class Ex13 { ctrl = new FormControl('', Validators.pattern(/^\d+$/)); }

// ── Ex14 – custom validator ───────────────────────────────────────────────────
function noSpaces(ctrl: AbstractControl): ValidationErrors | null {
  return ctrl.value?.includes(' ') ? { noSpaces: true } : null;
}
@Component({
  selector: 'ex-14', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <input [formControl]="ctrl" placeholder="No spaces allowed">
    @if (ctrl.dirty && ctrl.hasError('noSpaces')) { <p style="color:red">No spaces allowed!</p> }
  `
})
export class Ex14 { ctrl = new FormControl('', noSpaces); }

// ── Ex15 – async validator ────────────────────────────────────────────────────
function asyncUniqueEmail(taken: string[]): AsyncValidatorFn {
  return (ctrl: AbstractControl): Observable<ValidationErrors | null> =>
    of(taken.includes(ctrl.value)).pipe(delay(500), map(t => t ? { emailTaken: true } : null));
}
@Component({
  selector: 'ex-15', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <input [formControl]="ctrl" placeholder="Email (try: taken@x.com)">
    @if (ctrl.pending) { <span>Checking…</span> }
    @if (ctrl.hasError('emailTaken')) { <p style="color:red">Email already taken!</p> }
  `
})
export class Ex15 {
  ctrl = new FormControl('', null, asyncUniqueEmail(['taken@x.com', 'admin@x.com']));
}

// ── Ex16 – cross-field validator ─────────────────────────────────────────────
function passwordMatch(group: AbstractControl): ValidationErrors | null {
  const p = group.get('password')?.value;
  const c = group.get('confirm')?.value;
  return p && c && p !== c ? { mismatch: true } : null;
}
@Component({
  selector: 'ex-16', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <form [formGroup]="form">
      <input formControlName="password" type="password" placeholder="Password">
      <input formControlName="confirm" type="password" placeholder="Confirm">
      @if (form.hasError('mismatch')) { <p style="color:red">Passwords don't match!</p> }
    </form>
  `
})
export class Ex16 {
  fb = inject(FormBuilder);
  form = this.fb.group({ password: [''], confirm: [''] }, { validators: passwordMatch });
}

// ── Ex17 – FormArray add/remove ───────────────────────────────────────────────
@Component({
  selector: 'ex-17', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <form [formGroup]="form">
      <div formArrayName="skills">
        @for (ctrl of skills.controls; track $index) {
          <div>
            <input [formControlName]="$index" placeholder="Skill">
            <button (click)="remove($index)">×</button>
          </div>
        }
      </div>
    </form>
    <button (click)="add()">Add Skill</button>
    <pre>{{ form.value | json }}</pre>
  `
})
export class Ex17 {
  fb = inject(FormBuilder);
  form = this.fb.group({ skills: this.fb.array([this.fb.control('')]) });
  get skills() { return this.form.get('skills') as FormArray; }
  add() { this.skills.push(this.fb.control('')); }
  remove(i: number) { this.skills.removeAt(i); }
}

// ── Ex18 – nested FormGroup ───────────────────────────────────────────────────
@Component({
  selector: 'ex-18', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <form [formGroup]="form">
      <input formControlName="name" placeholder="Name">
      <div formGroupName="address">
        <input formControlName="city" placeholder="City">
        <input formControlName="zip" placeholder="ZIP">
      </div>
    </form>
    <pre>{{ form.value | json }}</pre>
  `
})
export class Ex18 {
  fb = inject(FormBuilder);
  form = this.fb.group({
    name: [''],
    address: this.fb.group({ city: [''], zip: [''] })
  });
}

// ── Ex19 – setValue vs patchValue ────────────────────────────────────────────
@Component({
  selector: 'ex-19', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <form [formGroup]="form">
      <input formControlName="first" placeholder="First">
      <input formControlName="last" placeholder="Last">
    </form>
    <button (click)="setVal()">setValue</button>
    <button (click)="patchVal()">patchValue</button>
    <pre>{{ form.value | json }}</pre>
  `
})
export class Ex19 {
  fb = inject(FormBuilder);
  form = this.fb.group({ first: [''], last: [''] });
  setVal() { this.form.setValue({ first: 'John', last: 'Doe' }); }
  patchVal() { this.form.patchValue({ first: 'Jane' }); }
}

// ── Ex20 – reset() ───────────────────────────────────────────────────────────
@Component({
  selector: 'ex-20', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <form [formGroup]="form">
      <input formControlName="email" placeholder="Email">
      <input formControlName="msg" placeholder="Message">
    </form>
    <button (click)="form.reset()">Reset</button>
    <pre>{{ form.value | json }}</pre>
  `
})
export class Ex20 {
  fb = inject(FormBuilder);
  form = this.fb.group({ email: [''], msg: [''] });
}

// ── Ex21 – disable / enable ───────────────────────────────────────────────────
@Component({
  selector: 'ex-21', standalone: true, imports: [ReactiveFormsModule], template: `
    <input [formControl]="ctrl" placeholder="Toggle disabled">
    <button (click)="ctrl.enabled ? ctrl.disable() : ctrl.enable()">
      {{ ctrl.enabled ? 'Disable' : 'Enable' }}
    </button>
    <p>Status: {{ ctrl.status }}</p>
  `
})
export class Ex21 { ctrl = new FormControl('test'); }

// ── Ex22 – dirty / touched / pristine ────────────────────────────────────────
@Component({
  selector: 'ex-22', standalone: true, imports: [ReactiveFormsModule], template: `
    <input [formControl]="ctrl" placeholder="Interact…">
    <p>Dirty: {{ ctrl.dirty }} | Touched: {{ ctrl.touched }} | Pristine: {{ ctrl.pristine }}</p>
  `
})
export class Ex22 { ctrl = new FormControl(''); }

// ── Ex23 – form submission ────────────────────────────────────────────────────
@Component({
  selector: 'ex-23', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <input formControlName="title" placeholder="Title">
      <textarea formControlName="body" placeholder="Body"></textarea>
      <button type="submit" [disabled]="form.invalid">Submit</button>
    </form>
    @if (submitted) { <p>Submitted: {{ form.value.title }}</p> }
  `
})
export class Ex23 {
  fb = inject(FormBuilder);
  form = this.fb.group({ title: ['', Validators.required], body: [''] });
  submitted = false;
  submit() { if (this.form.valid) this.submitted = true; }
}

// ── Ex24 – reactive form in service ──────────────────────────────────────────
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ProfileFormService {
  fb = inject(FormBuilder);
  form = this.fb.group({ name: ['', Validators.required], bio: [''] });
}

@Component({
  selector: 'ex-24', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <form [formGroup]="svc.form" (ngSubmit)="save()">
      <input formControlName="name" placeholder="Name">
      <textarea formControlName="bio" placeholder="Bio"></textarea>
      <button type="submit" [disabled]="svc.form.invalid">Save</button>
    </form>
    @if (saved) { <p>Saved!</p> }
  `
})
export class Ex24 { svc = inject(ProfileFormService); saved = false; save() { this.saved = true; } }

// ── Ex25 – signal + reactive form sync ───────────────────────────────────────
@Component({
  selector: 'ex-25', standalone: true, imports: [ReactiveFormsModule], template: `
    <input [formControl]="ctrl" placeholder="Type…">
    <p>Signal mirror: {{ mirror() }}</p>
  `
})
export class Ex25 {
  ctrl = new FormControl('');
  mirror = signal('');
  constructor() {
    this.ctrl.valueChanges.pipe(takeUntilDestroyed()).subscribe(v => this.mirror.set(v ?? ''));
  }
}

// ── Ex26 – ControlValueAccessor simple ───────────────────────────────────────
@Component({
  selector: 'ex-26-toggle',
  standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: Ex26Toggle, multi: true }],
  template: `
    <button (click)="toggle()" [style.background]="checked ? '#4caf50' : '#ccc'">
      {{ checked ? 'ON' : 'OFF' }}
    </button>
  `
})
export class Ex26Toggle implements ControlValueAccessor {
  checked = false;
  private onChange = (_: boolean) => {};
  writeValue(v: boolean) { this.checked = v; }
  registerOnChange(fn: (_: boolean) => void) { this.onChange = fn; }
  registerOnTouched(_: () => void) {}
  toggle() { this.checked = !this.checked; this.onChange(this.checked); }
}

@Component({
  selector: 'ex-26', standalone: true, imports: [ReactiveFormsModule, Ex26Toggle], template: `
    <ex-26-toggle [formControl]="ctrl"></ex-26-toggle>
    <p>Value: {{ ctrl.value }}</p>
  `
})
export class Ex26 { ctrl = new FormControl(false); }

// ── Ex27 – CVA star rating ────────────────────────────────────────────────────
@Component({
  selector: 'ex-27-star',
  standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: Ex27Star, multi: true }],
  template: `
    @for (s of stars; track s) {
      <span (click)="set(s)" [style.color]="s <= value ? 'gold' : '#ccc'" style="cursor:pointer;font-size:24px">★</span>
    }
  `
})
export class Ex27Star implements ControlValueAccessor {
  stars = [1, 2, 3, 4, 5];
  value = 0;
  private onChange = (_: number) => {};
  writeValue(v: number) { this.value = v; }
  registerOnChange(fn: (_: number) => void) { this.onChange = fn; }
  registerOnTouched(_: () => void) {}
  set(v: number) { this.value = v; this.onChange(v); }
}

@Component({
  selector: 'ex-27', standalone: true, imports: [ReactiveFormsModule, Ex27Star], template: `
    <ex-27-star [formControl]="rating"></ex-27-star>
    <p>Rating: {{ rating.value }}/5</p>
  `
})
export class Ex27 { rating = new FormControl(0); }

// ── Ex28 – CVA phone input ────────────────────────────────────────────────────
@Component({
  selector: 'ex-28-phone',
  standalone: true,
  imports: [FormsModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: Ex28Phone, multi: true }],
  template: `<input [(ngModel)]="val" (ngModelChange)="notify($event)" placeholder="(XXX) XXX-XXXX">`
})
export class Ex28Phone implements ControlValueAccessor {
  val = '';
  private onChange = (_: string) => {};
  writeValue(v: string) { this.val = v; }
  registerOnChange(fn: (_: string) => void) { this.onChange = fn; }
  registerOnTouched(_: () => void) {}
  notify(v: string) {
    const digits = v.replace(/\D/g, '').slice(0, 10);
    const fmt = digits.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    this.val = fmt || digits;
    this.onChange(this.val);
  }
}

@Component({
  selector: 'ex-28', standalone: true, imports: [ReactiveFormsModule, Ex28Phone], template: `
    <ex-28-phone [formControl]="phone"></ex-28-phone>
    <p>Phone: {{ phone.value }}</p>
  `
})
export class Ex28 { phone = new FormControl(''); }

// ── Ex29 – form wizard pattern ────────────────────────────────────────────────
@Component({
  selector: 'ex-29', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <p>Step {{ step() }} / 3</p>
    @if (step() === 1) {
      <input [formControl]="name" placeholder="Name">
      <button (click)="next()" [disabled]="name.invalid">Next</button>
    }
    @if (step() === 2) {
      <input [formControl]="email" type="email" placeholder="Email">
      <button (click)="prev()">Back</button>
      <button (click)="next()" [disabled]="email.invalid">Next</button>
    }
    @if (step() === 3) {
      <p>Name: {{ name.value }}</p>
      <p>Email: {{ email.value }}</p>
      <button (click)="prev()">Back</button>
      <button (click)="submit()">Submit</button>
    }
    @if (done()) { <p>Done!</p> }
  `
})
export class Ex29 {
  step = signal(1);
  name = new FormControl('', Validators.required);
  email = new FormControl('', [Validators.required, Validators.email]);
  done = signal(false);
  next() { this.step.update(s => s + 1); }
  prev() { this.step.update(s => s - 1); }
  submit() { this.done.set(true); }
}

// ── Ex30 – dynamic form fields ────────────────────────────────────────────────
@Component({
  selector: 'ex-30', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <form [formGroup]="form">
      @for (field of fields(); track field) {
        <div>
          <label>{{ field }}</label>
          <input [formControlName]="field">
        </div>
      }
    </form>
    <button (click)="addField()">Add Field</button>
    <pre>{{ form.value | json }}</pre>
  `
})
export class Ex30 {
  fb = inject(FormBuilder);
  fields = signal<string[]>(['field_0']);
  form = this.fb.group({ field_0: [''] });
  addField() {
    const name = `field_${this.fields().length}`;
    this.fields.update(f => [...f, name]);
    this.form.addControl(name, this.fb.control(''));
  }
}

// ── Ex31 – typed forms (FormControl<string>) ──────────────────────────────────
@Component({
  selector: 'ex-31', standalone: true, imports: [ReactiveFormsModule], template: `
    <input [formControl]="ctrl" placeholder="Typed FormControl<string>">
    <p>{{ ctrl.value.toUpperCase() }}</p>
  `
})
export class Ex31 { ctrl = new FormControl<string>('hello', { nonNullable: true }); }

// ── Ex32 – nonNullable / strictTypedForms ─────────────────────────────────────
@Component({
  selector: 'ex-32', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <form [formGroup]="form">
      <input formControlName="username">
      <input formControlName="count" type="number">
    </form>
    <p>Value: {{ form.getRawValue() | json }}</p>
    <button (click)="form.reset()">Reset (non-null defaults)</button>
  `
})
export class Ex32 {
  fb = inject(FormBuilder);
  form = this.fb.nonNullable.group({ username: 'Alice', count: 0 });
}

// ── Ex33 – form with HTTP submit ──────────────────────────────────────────────
@Component({
  selector: 'ex-33', standalone: true, imports: [ReactiveFormsModule, CommonModule],
  providers: [provideHttpClient()], template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <input formControlName="title" placeholder="Post title">
      <button type="submit" [disabled]="form.invalid || loading()">
        {{ loading() ? 'Saving…' : 'Save' }}
      </button>
    </form>
    @if (saved()) { <p>Saved: {{ saved() }}</p> }
  `
})
export class Ex33 {
  fb = inject(FormBuilder);
  http = inject(HttpClient);
  form = this.fb.group({ title: ['', Validators.required] });
  loading = signal(false);
  saved = signal('');
  submit() {
    this.loading.set(true);
    this.http.post<{ id: number; title: string }>('https://jsonplaceholder.typicode.com/posts', this.form.value)
      .subscribe(r => { this.saved.set(r.title ?? ''); this.loading.set(false); });
  }
}

// ── Ex34 – form with loading state ────────────────────────────────────────────
@Component({
  selector: 'ex-34', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <input formControlName="msg" placeholder="Message">
      <button [disabled]="loading()">{{ loading() ? 'Sending…' : 'Send' }}</button>
    </form>
    <p>{{ status() }}</p>
  `
})
export class Ex34 {
  fb = inject(FormBuilder);
  form = this.fb.group({ msg: ['', Validators.required] });
  loading = signal(false);
  status = signal('');
  submit() {
    this.loading.set(true);
    this.status.set('');
    setTimeout(() => { this.loading.set(false); this.status.set('Sent!'); this.form.reset(); }, 1000);
  }
}

// ── Ex35 – form error display ─────────────────────────────────────────────────
@Component({
  selector: 'ex-35', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <div>
        <input formControlName="email" placeholder="Email" (blur)="form.get('email')!.markAsTouched()">
        @if (form.get('email')!.touched) {
          @if (form.get('email')!.hasError('required')) { <p style="color:red">Required</p> }
          @if (form.get('email')!.hasError('email')) { <p style="color:red">Invalid email</p> }
        }
      </div>
      <button type="submit" [disabled]="form.invalid">Submit</button>
    </form>
  `
})
export class Ex35 {
  fb = inject(FormBuilder);
  form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  submit() {}
}

// ── Ex36 – multi-step form with signal state ──────────────────────────────────
@Component({
  selector: 'ex-36', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <p>Step: {{ state().step }} / 2</p>
    @if (state().step === 1) {
      <input [formControl]="nameCtrl" placeholder="Name">
      <button (click)="toStep2()" [disabled]="nameCtrl.invalid">Next</button>
    }
    @if (state().step === 2) {
      <input [formControl]="emailCtrl" type="email" placeholder="Email">
      <button (click)="back()">Back</button>
      <button (click)="finish()" [disabled]="emailCtrl.invalid">Finish</button>
    }
    @if (state().done) {
      <p>Done! {{ state().name }} / {{ state().email }}</p>
    }
  `
})
export class Ex36 {
  nameCtrl = new FormControl('', Validators.required);
  emailCtrl = new FormControl('', [Validators.required, Validators.email]);
  state = signal({ step: 1, done: false, name: '', email: '' });
  toStep2() { this.state.update(s => ({ ...s, step: 2, name: this.nameCtrl.value ?? '' })); }
  back() { this.state.update(s => ({ ...s, step: 1 })); }
  finish() { this.state.update(s => ({ ...s, done: true, email: this.emailCtrl.value ?? '' })); }
}

// ── Ex37 – FormArray of FormGroups ────────────────────────────────────────────
@Component({
  selector: 'ex-37', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <form [formGroup]="form">
      <div formArrayName="contacts">
        @for (g of contacts.controls; track $index) {
          <div [formGroupName]="$index">
            <input formControlName="name" placeholder="Name">
            <input formControlName="phone" placeholder="Phone">
            <button (click)="remove($index)">×</button>
          </div>
        }
      </div>
    </form>
    <button (click)="add()">Add Contact</button>
    <pre>{{ form.value | json }}</pre>
  `
})
export class Ex37 {
  fb = inject(FormBuilder);
  form = this.fb.group({ contacts: this.fb.array([]) });
  get contacts() { return this.form.get('contacts') as FormArray; }
  add() { this.contacts.push(this.fb.group({ name: [''], phone: [''] })); }
  remove(i: number) { this.contacts.removeAt(i); }
}

// ── Ex38 – conditional validators ────────────────────────────────────────────
@Component({
  selector: 'ex-38', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <form [formGroup]="form">
      <select formControlName="type">
        <option value="individual">Individual</option>
        <option value="company">Company</option>
      </select>
      @if (form.get('type')!.value === 'company') {
        <input formControlName="vat" placeholder="VAT number (required for company)">
        @if (form.get('vat')!.hasError('required')) { <p style="color:red">VAT required</p> }
      }
    </form>
  `
})
export class Ex38 {
  fb = inject(FormBuilder);
  form = this.fb.group({ type: ['individual'], vat: [''] });
  constructor() {
    this.form.get('type')!.valueChanges.pipe(takeUntilDestroyed()).subscribe(t => {
      const vat = this.form.get('vat')!;
      t === 'company' ? vat.setValidators(Validators.required) : vat.clearValidators();
      vat.updateValueAndValidity();
    });
  }
}

// ── Ex39 – form validation summary ───────────────────────────────────────────
@Component({
  selector: 'ex-39', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <input formControlName="name" placeholder="Name">
      <input formControlName="email" type="email" placeholder="Email">
      <button type="submit">Submit</button>
    </form>
    @if (errors().length) {
      <ul>@for (e of errors(); track e) { <li style="color:red">{{ e }}</li> }</ul>
    }
  `
})
export class Ex39 {
  fb = inject(FormBuilder);
  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]]
  });
  errors = signal<string[]>([]);
  submit() {
    this.form.markAllAsTouched();
    const errs: string[] = [];
    if (this.form.get('name')!.hasError('required')) errs.push('Name is required');
    if (this.form.get('email')!.hasError('required')) errs.push('Email is required');
    if (this.form.get('email')!.hasError('email')) errs.push('Email is invalid');
    this.errors.set(errs);
  }
}

// ── Ex40 – form with computed summary ────────────────────────────────────────
@Component({
  selector: 'ex-40', standalone: true, imports: [ReactiveFormsModule], template: `
    <input [formControl]="first" placeholder="First">
    <input [formControl]="last" placeholder="Last">
    <p>Full name: {{ full() }}</p>
    <p>Length: {{ len() }}</p>
  `
})
export class Ex40 {
  first = new FormControl('', { nonNullable: true });
  last = new FormControl('', { nonNullable: true });
  firstSig = signal('');
  lastSig = signal('');
  full = computed(() => `${this.firstSig()} ${this.lastSig()}`.trim());
  len = computed(() => this.full().length);
  constructor() {
    this.first.valueChanges.pipe(takeUntilDestroyed()).subscribe(v => this.firstSig.set(v));
    this.last.valueChanges.pipe(takeUntilDestroyed()).subscribe(v => this.lastSig.set(v));
  }
}

// ── Ex41 – debounced search form ──────────────────────────────────────────────
@Component({
  selector: 'ex-41', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <input [formControl]="search" placeholder="Search…">
    <p>Query: {{ query() }}</p>
  `
})
export class Ex41 {
  search = new FormControl('');
  query = signal('');
  constructor() {
    import('rxjs/operators').then(({ debounceTime, distinctUntilChanged }) => {
      this.search.valueChanges
        .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
        .subscribe(v => this.query.set(v ?? ''));
    });
  }
}

// ── Ex42 – auto-save on valueChanges ─────────────────────────────────────────
@Component({
  selector: 'ex-42', standalone: true, imports: [ReactiveFormsModule], template: `
    <input [formControl]="notes" placeholder="Notes (auto-saves)">
    <p>Saved: {{ savedAt() }}</p>
  `
})
export class Ex42 {
  notes = new FormControl('');
  savedAt = signal('');
  constructor() {
    this.notes.valueChanges.pipe(takeUntilDestroyed()).subscribe(v => {
      localStorage.setItem('ex42-notes', v ?? '');
      this.savedAt.set(new Date().toLocaleTimeString());
    });
  }
}

// ── Ex43 – form array min-length validator ────────────────────────────────────
function minItems(min: number) {
  return (ctrl: AbstractControl): ValidationErrors | null =>
    (ctrl as FormArray).length < min ? { minItems: { required: min, actual: (ctrl as FormArray).length } } : null;
}
@Component({
  selector: 'ex-43', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <div formArrayName="tags" [formGroup]="form">
      @for (c of tags.controls; track $index) {
        <input [formControlName]="$index" placeholder="Tag">
        <button (click)="remove($index)">×</button>
      }
    </div>
    <button (click)="add()">Add Tag</button>
    @if (tags.hasError('minItems')) { <p style="color:red">Add at least 2 tags</p> }
  `
})
export class Ex43 {
  fb = inject(FormBuilder);
  form = this.fb.group({ tags: this.fb.array([], minItems(2)) });
  get tags() { return this.form.get('tags') as FormArray; }
  add() { this.tags.push(this.fb.control('')); }
  remove(i: number) { this.tags.removeAt(i); }
}

// ── Ex44 – disabled form controls ────────────────────────────────────────────
@Component({
  selector: 'ex-44', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <form [formGroup]="form">
      <input formControlName="username" placeholder="Username (always disabled)">
      <input formControlName="bio" placeholder="Bio (editable)">
    </form>
    <pre>{{ form.getRawValue() | json }}</pre>
  `
})
export class Ex44 {
  fb = inject(FormBuilder);
  form = this.fb.group({
    username: [{ value: 'alice', disabled: true }],
    bio: ['Frontend dev']
  });
}

// ── Ex45 – updateOn: 'blur' ───────────────────────────────────────────────────
@Component({
  selector: 'ex-45', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <input [formControl]="ctrl" placeholder="Updates on blur">
    <p>Value: {{ ctrl.value }}</p>
    @if (ctrl.hasError('minlength')) { <p style="color:red">Too short</p> }
  `
})
export class Ex45 {
  ctrl = new FormControl('', { validators: Validators.minLength(4), updateOn: 'blur' });
}

// ── Ex46 – markAllAsTouched ───────────────────────────────────────────────────
@Component({
  selector: 'ex-46', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <form [formGroup]="form">
      <input formControlName="name" placeholder="Name">
      <input formControlName="email" type="email" placeholder="Email">
    </form>
    <button (click)="validate()">Validate All</button>
    @if (form.get('name')!.touched && form.get('name')!.hasError('required')) {
      <p style="color:red">Name required</p>
    }
  `
})
export class Ex46 {
  fb = inject(FormBuilder);
  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]]
  });
  validate() { this.form.markAllAsTouched(); }
}

// ── Ex47 – async form submission with feedback ────────────────────────────────
@Component({
  selector: 'ex-47', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <input formControlName="code" placeholder="Invite code">
      <button type="submit" [disabled]="form.invalid || submitting()">
        {{ submitting() ? '…' : 'Redeem' }}
      </button>
    </form>
    <p>{{ feedback() }}</p>
  `
})
export class Ex47 {
  fb = inject(FormBuilder);
  form = this.fb.group({ code: ['', Validators.required] });
  submitting = signal(false);
  feedback = signal('');
  submit() {
    this.submitting.set(true);
    setTimeout(() => {
      this.submitting.set(false);
      this.feedback.set(this.form.value.code === 'ANGULAR' ? 'Redeemed!' : 'Invalid code');
    }, 800);
  }
}

// ── Ex48 – form field counter (maxlength display) ─────────────────────────────
@Component({
  selector: 'ex-48', standalone: true, imports: [ReactiveFormsModule], template: `
    <textarea [formControl]="ctrl" maxlength="200" placeholder="Bio (max 200)"></textarea>
    <p>{{ ctrl.value?.length ?? 0 }} / 200</p>
  `
})
export class Ex48 {
  ctrl = new FormControl('', Validators.maxLength(200));
}

// ── Ex49 – reactive form patchValue from HTTP ─────────────────────────────────
@Component({
  selector: 'ex-49', standalone: true, imports: [ReactiveFormsModule, CommonModule],
  providers: [provideHttpClient()], template: `
    <form [formGroup]="form">
      <input formControlName="name" placeholder="Name">
      <input formControlName="email" placeholder="Email">
    </form>
    <button (click)="load()">Load from API</button>
    <pre>{{ form.value | json }}</pre>
  `
})
export class Ex49 {
  fb = inject(FormBuilder);
  http = inject(HttpClient);
  form = this.fb.group({ name: [''], email: [''] });
  load() {
    this.http.get<{ name: string; email: string }>('https://jsonplaceholder.typicode.com/users/1')
      .subscribe(u => this.form.patchValue({ name: u.name, email: u.email }));
  }
}

// ── Ex50 – full reactive form (register) ─────────────────────────────────────
function passwordMatchFull(group: AbstractControl): ValidationErrors | null {
  const p = group.get('password')?.value;
  const c = group.get('confirm')?.value;
  return p && c && p !== c ? { mismatch: true } : null;
}
@Component({
  selector: 'ex-50', standalone: true, imports: [ReactiveFormsModule, CommonModule], template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <input formControlName="username" placeholder="Username">
      @if (form.get('username')!.touched && form.get('username')!.hasError('required')) {
        <p style="color:red">Username required</p>
      }
      <input formControlName="email" type="email" placeholder="Email">
      <input formControlName="password" type="password" placeholder="Password (min 6)">
      <input formControlName="confirm" type="password" placeholder="Confirm Password">
      @if (form.hasError('mismatch')) { <p style="color:red">Passwords don't match</p> }
      <button type="submit" [disabled]="form.invalid">Register</button>
    </form>
    @if (done()) { <p>Registered as {{ form.value.username }}</p> }
  `
})
export class Ex50 {
  fb = inject(FormBuilder);
  form = this.fb.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirm: ['', Validators.required]
  }, { validators: passwordMatchFull });
  done = signal(false);
  submit() { if (this.form.valid) this.done.set(true); }
}

// ── AppComponent ──────────────────────────────────────────────────────────────
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    Ex01, Ex02, Ex03, Ex04, Ex05, Ex06, Ex07, Ex08, Ex09, Ex10,
    Ex11, Ex12, Ex13, Ex14, Ex15, Ex16, Ex17, Ex18, Ex19, Ex20,
    Ex21, Ex22, Ex23, Ex24, Ex25, Ex26, Ex27, Ex28, Ex29, Ex30,
    Ex31, Ex32, Ex33, Ex34, Ex35, Ex36, Ex37, Ex38, Ex39, Ex40,
    Ex41, Ex42, Ex43, Ex44, Ex45, Ex46, Ex47, Ex48, Ex49, Ex50
  ],
  template: `
    <div style="font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px">
      <h1>Phase 3 – Forms Examples</h1>

      <h4>Ex01 – ngModel simple</h4><ex-01 /><hr />
      <h4>Ex02 – ngModel two-way</h4><ex-02 /><hr />
      <h4>Ex03 – ngForm</h4><ex-03 /><hr />
      <h4>Ex04 – template-driven login</h4><ex-04 /><hr />
      <h4>Ex05 – FormControl</h4><ex-05 /><hr />
      <h4>Ex06 – FormGroup</h4><ex-06 /><hr />
      <h4>Ex07 – FormBuilder</h4><ex-07 /><hr />
      <h4>Ex08 – valueChanges</h4><ex-08 /><hr />
      <h4>Ex09 – statusChanges</h4><ex-09 /><hr />
      <h4>Ex10 – Validators.required</h4><ex-10 /><hr />
      <h4>Ex11 – minLength / maxLength</h4><ex-11 /><hr />
      <h4>Ex12 – email validator</h4><ex-12 /><hr />
      <h4>Ex13 – pattern validator</h4><ex-13 /><hr />
      <h4>Ex14 – custom validator</h4><ex-14 /><hr />
      <h4>Ex15 – async validator</h4><ex-15 /><hr />
      <h4>Ex16 – cross-field validator</h4><ex-16 /><hr />
      <h4>Ex17 – FormArray add/remove</h4><ex-17 /><hr />
      <h4>Ex18 – nested FormGroup</h4><ex-18 /><hr />
      <h4>Ex19 – setValue vs patchValue</h4><ex-19 /><hr />
      <h4>Ex20 – reset()</h4><ex-20 /><hr />
      <h4>Ex21 – disable / enable</h4><ex-21 /><hr />
      <h4>Ex22 – dirty / touched / pristine</h4><ex-22 /><hr />
      <h4>Ex23 – form submission</h4><ex-23 /><hr />
      <h4>Ex24 – reactive form in service</h4><ex-24 /><hr />
      <h4>Ex25 – signal + reactive form sync</h4><ex-25 /><hr />
      <h4>Ex26 – ControlValueAccessor simple</h4><ex-26 /><hr />
      <h4>Ex27 – CVA star rating</h4><ex-27 /><hr />
      <h4>Ex28 – CVA phone</h4><ex-28 /><hr />
      <h4>Ex29 – form wizard pattern</h4><ex-29 /><hr />
      <h4>Ex30 – dynamic form fields</h4><ex-30 /><hr />
      <h4>Ex31 – typed forms FormControl&lt;string&gt;</h4><ex-31 /><hr />
      <h4>Ex32 – nonNullable / strictTypedForms</h4><ex-32 /><hr />
      <h4>Ex33 – form with HTTP submit</h4><ex-33 /><hr />
      <h4>Ex34 – form with loading state</h4><ex-34 /><hr />
      <h4>Ex35 – form error display</h4><ex-35 /><hr />
      <h4>Ex36 – multi-step form signal state</h4><ex-36 /><hr />
      <h4>Ex37 – FormArray of FormGroups</h4><ex-37 /><hr />
      <h4>Ex38 – conditional validators</h4><ex-38 /><hr />
      <h4>Ex39 – form validation summary</h4><ex-39 /><hr />
      <h4>Ex40 – form with computed summary</h4><ex-40 /><hr />
      <h4>Ex41 – debounced search form</h4><ex-41 /><hr />
      <h4>Ex42 – auto-save on valueChanges</h4><ex-42 /><hr />
      <h4>Ex43 – FormArray min-length</h4><ex-43 /><hr />
      <h4>Ex44 – disabled form controls</h4><ex-44 /><hr />
      <h4>Ex45 – updateOn: 'blur'</h4><ex-45 /><hr />
      <h4>Ex46 – markAllAsTouched</h4><ex-46 /><hr />
      <h4>Ex47 – async form submission</h4><ex-47 /><hr />
      <h4>Ex48 – form field counter</h4><ex-48 /><hr />
      <h4>Ex49 – patchValue from HTTP</h4><ex-49 /><hr />
      <h4>Ex50 – full reactive register form</h4><ex-50 /><hr />
    </div>
  `
})
export class AppComponent {}
