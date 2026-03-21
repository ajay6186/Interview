import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// ============================================================
// Solution 4.2 — Reactive Forms
// ============================================================

// SOLUTION 1: FormControl with valueChanges
@Component({
  selector: 'app-simple-reactive',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>FormControl + valueChanges</h3>
      <input [formControl]="nameCtrl" placeholder="Type your name..." />
      <p>Value: <strong>{{ latest() }}</strong></p>
    </section>
  `,
})
class SimpleReactiveComponent {
  nameCtrl = new FormControl('');
  latest   = signal('');

  constructor() {
    this.nameCtrl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(v => this.latest.set(v ?? ''));
  }
}

// SOLUTION 2: Login FormGroup
@Component({
  selector: 'app-login-reactive',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Login (FormGroup)</h3>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div>
          <label>Email: <input formControlName="email" type="email" /></label>
          @if (form.controls.email.invalid && form.controls.email.touched) {
            <span style="color:red"> Invalid email</span>
          }
        </div>
        <div>
          <label>Password: <input formControlName="password" type="password" /></label>
          @if (form.controls.password.invalid && form.controls.password.touched) {
            <span style="color:red"> Min 8 characters required</span>
          }
        </div>
        <button type="submit" [disabled]="form.invalid">Login</button>
      </form>
    </section>
  `,
})
class LoginReactiveComponent {
  form = new FormGroup({
    email:    new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
  });

  onSubmit() {
    if (this.form.valid) console.log('Login:', this.form.value);
  }
}

// SOLUTION 3: Profile form with FormBuilder + nested group
@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [ReactiveFormsModule, JsonPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Profile Form (FormBuilder)</h3>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <label>First: <input formControlName="firstName" /></label>
        <label style="margin-left:8px">Last: <input formControlName="lastName" /></label><br /><br />
        <label>Email: <input formControlName="email" type="email" /></label><br /><br />
        <fieldset formGroupName="address">
          <legend>Address</legend>
          <label>Street: <input formControlName="street" /></label><br />
          <label>City: <input formControlName="city" /></label>
          <label style="margin-left:8px">Zip: <input formControlName="zip" /></label>
        </fieldset>
        <button type="submit" style="margin-top:8px">Save</button>
      </form>
      <pre style="background:#f4f4f4; padding:8px; border-radius:4px; margin-top:8px; font-size:12px">{{ form.value | json }}</pre>
    </section>
  `,
})
class ProfileFormComponent {
  private fb = inject(FormBuilder);
  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
    address: this.fb.group({
      street: [''],
      city:   [''],
      zip:    [''],
    }),
  });

  onSubmit() { console.log('Profile:', this.form.value); }
}

// SOLUTION 4: Form state display
@Component({
  selector: 'app-form-state',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Form State</h3>
      <form [formGroup]="form">
        <textarea formControlName="notes" rows="3" cols="40" placeholder="Type here..."></textarea>
      </form>
      <table style="margin-top:8px; border-collapse:collapse;">
        @for (s of states; track s.label) {
          <tr>
            <td style="padding:2px 8px">{{ s.label }}</td>
            <td [style.color]="s.value ? 'green' : 'red'">{{ s.value }}</td>
          </tr>
        }
      </table>
    </section>
  `,
})
class FormStateComponent {
  form = new FormGroup({ notes: new FormControl('', Validators.required) });

  get states() {
    const c = this.form;
    return [
      { label: 'valid',    value: c.valid },
      { label: 'invalid',  value: c.invalid },
      { label: 'dirty',    value: c.dirty },
      { label: 'pristine', value: c.pristine },
      { label: 'touched',  value: c.touched },
    ];
  }
}

// SOLUTION 5: Disable/enable control
@Component({
  selector: 'app-disable-enable',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Disable / Enable Control</h3>
      <input [formControl]="ctrl" placeholder="Input field" />
      <p>Status: <strong>{{ ctrl.enabled ? 'Enabled' : 'Disabled' }}</strong></p>
      <button (click)="ctrl.disable()">Disable</button>
      <button (click)="ctrl.enable()" style="margin-left:8px">Enable</button>
    </section>
  `,
})
class DisableEnableComponent {
  ctrl = new FormControl('');
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SimpleReactiveComponent, LoginReactiveComponent, ProfileFormComponent,
            FormStateComponent, DisableEnableComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 4.2 — Reactive Forms</h1>
      <app-simple-reactive /><hr />
      <app-login-reactive /><hr />
      <app-profile-form /><hr />
      <app-form-state /><hr />
      <app-disable-enable />
    </div>
  `,
})
export class AppComponent {}
