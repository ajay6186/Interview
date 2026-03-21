import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, FormBuilder, Validators, NonNullableFormBuilder, FormRecord } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';

// ============================================================
// Examples 4.2 — Reactive Forms (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ────────────────────────────────────────────

// 1. FormControl single input
@Component({
  selector: 'ex-01', standalone: true, imports: [ReactiveFormsModule],
  template: `<input [formControl]="ctrl" placeholder="Type..." /><p>{{ ctrl.value }}</p>`
})
class Ex01 { ctrl = new FormControl(''); }

// 2. FormControl with initial value
@Component({
  selector: 'ex-02', standalone: true, imports: [ReactiveFormsModule],
  template: `<input [formControl]="ctrl" /><p>{{ ctrl.value }}</p>`
})
class Ex02 { ctrl = new FormControl('Angular'); }

// 3. FormControl valueChanges
@Component({
  selector: 'ex-03', standalone: true, imports: [ReactiveFormsModule],
  template: `<input [formControl]="ctrl" placeholder="Type..." /><p>Changes: {{ count }}</p>`
})
class Ex03 implements OnInit {
  ctrl = new FormControl('');
  count = 0;
  ngOnInit() { this.ctrl.valueChanges.subscribe(() => this.count++); }
}

// 4. FormGroup simple
@Component({
  selector: 'ex-04', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input formControlName="name" placeholder="Name" />
      <input formControlName="email" placeholder="Email" />
    </form>
    <pre>{{ form.value | json }}</pre>
  `
})
class Ex04 {
  form = new FormGroup({
    name: new FormControl(''),
    email: new FormControl(''),
  });
}

// 5. FormGroup submission
@Component({
  selector: 'ex-05', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <input formControlName="title" placeholder="Title" />
      <button type="submit">Submit</button>
    </form>
    @if (submitted) { <pre>{{ form.value | json }}</pre> }
  `
})
class Ex05 {
  form = new FormGroup({ title: new FormControl('') });
  submitted = false;
  onSubmit() { this.submitted = true; }
}

// 6. FormBuilder.group
@Component({
  selector: 'ex-06', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input formControlName="first" placeholder="First" />
      <input formControlName="last" placeholder="Last" />
    </form>
    <pre>{{ form.value | json }}</pre>
  `
})
class Ex06 {
  constructor(private fb: FormBuilder) {}
  form = this.fb.group({ first: [''], last: [''] });
}

// 7. FormBuilder.control
@Component({
  selector: 'ex-07', standalone: true, imports: [ReactiveFormsModule],
  template: `<input [formControl]="ctrl" /><p>{{ ctrl.value }}</p>`
})
class Ex07 {
  constructor(private fb: FormBuilder) {}
  ctrl = this.fb.control('Hello');
}

// 8. form.value
@Component({
  selector: 'ex-08', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input formControlName="a" placeholder="A" />
      <input formControlName="b" placeholder="B" />
    </form>
    <p>form.value: {{ form.value | json }}</p>
  `
})
class Ex08 {
  form = new FormGroup({ a: new FormControl('x'), b: new FormControl('y') });
}

// 9. form.getRawValue()
@Component({
  selector: 'ex-09', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input formControlName="visible" placeholder="Visible" />
      <input formControlName="hidden" placeholder="Disabled (hidden from .value)" />
    </form>
    <p>value: {{ form.value | json }}</p>
    <p>raw: {{ form.getRawValue() | json }}</p>
  `
})
class Ex09 {
  form = new FormGroup({
    visible: new FormControl('shown'),
    hidden: new FormControl({ value: 'secret', disabled: true }),
  });
}

// 10. form.valid
@Component({
  selector: 'ex-10', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input formControlName="email" placeholder="Email" />
    </form>
    <p>Valid: {{ form.valid }} | Invalid: {{ form.invalid }}</p>
  `
})
class Ex10 {
  form = new FormGroup({ email: new FormControl('', [Validators.required, Validators.email]) });
}

// 11. form.errors
@Component({
  selector: 'ex-11', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Min 3 chars" />
    <p>Errors: {{ ctrl.errors | json }}</p>
  `
})
class Ex11 { ctrl = new FormControl('', [Validators.required, Validators.minLength(3)]); }

// 12. form.reset()
@Component({
  selector: 'ex-12', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input formControlName="name" placeholder="Name" />
    </form>
    <button (click)="form.reset()">Reset</button>
    <p>{{ form.value | json }}</p>
  `
})
class Ex12 { form = new FormGroup({ name: new FormControl('Angular') }); }

// 13. form.patchValue()
@Component({
  selector: 'ex-13', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input formControlName="first" /><input formControlName="last" />
    </form>
    <button (click)="patch()">Patch First Name</button>
    <pre>{{ form.value | json }}</pre>
  `
})
class Ex13 {
  form = new FormGroup({ first: new FormControl(''), last: new FormControl('') });
  patch() { this.form.patchValue({ first: 'Patched!' }); }
}

// ─── INTERMEDIATE (14–26) ─────────────────────────────────────

// 14. FormGroup login
@Component({
  selector: 'ex-14', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="result = form.value">
      <input formControlName="email" placeholder="Email" />
      <input type="password" formControlName="password" placeholder="Password" />
      <button [disabled]="form.invalid">Login</button>
    </form>
    @if (result) { <pre>{{ result | json }}</pre> }
  `
})
class Ex14 {
  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });
  result: any = null;
}

// 15. FormGroup profile
@Component({
  selector: 'ex-15', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="saved = form.value">
      <input formControlName="displayName" placeholder="Display Name" />
      <input formControlName="bio" placeholder="Bio" />
      <input type="number" formControlName="age" placeholder="Age" />
      <button type="submit">Save</button>
    </form>
    @if (saved) { <pre>{{ saved | json }}</pre> }
  `
})
class Ex15 {
  form = new FormGroup({
    displayName: new FormControl(''),
    bio: new FormControl(''),
    age: new FormControl<number | null>(null),
  });
  saved: any = null;
}

// 16. FormBuilder with nested group
@Component({
  selector: 'ex-16', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input formControlName="username" placeholder="Username" />
      <div formGroupName="address">
        <input formControlName="street" placeholder="Street" />
        <input formControlName="city" placeholder="City" />
      </div>
    </form>
    <pre>{{ form.value | json }}</pre>
  `
})
class Ex16 {
  constructor(private fb: FormBuilder) {}
  form = this.fb.group({
    username: [''],
    address: this.fb.group({ street: [''], city: [''] }),
  });
}

// 17. setValue vs patchValue
@Component({
  selector: 'ex-17', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input formControlName="a" /><input formControlName="b" /><input formControlName="c" />
    </form>
    <button (click)="doSet()">setValue (all fields)</button>
    <button (click)="doPatch()">patchValue (partial)</button>
    <pre>{{ form.value | json }}</pre>
  `
})
class Ex17 {
  form = new FormGroup({ a: new FormControl(''), b: new FormControl(''), c: new FormControl('') });
  doSet() { this.form.setValue({ a: 'A', b: 'B', c: 'C' }); }
  doPatch() { this.form.patchValue({ a: 'Only A patched' }); }
}

// 18. Disable / enable control
@Component({
  selector: 'ex-18', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Toggleable field" />
    <button (click)="toggle()">{{ ctrl.disabled ? 'Enable' : 'Disable' }}</button>
    <p>Status: {{ ctrl.status }}</p>
  `
})
class Ex18 {
  ctrl = new FormControl('editable');
  toggle() { this.ctrl.disabled ? this.ctrl.enable() : this.ctrl.disable(); }
}

// 19. Disable / enable group
@Component({
  selector: 'ex-19', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input formControlName="name" /><input formControlName="email" />
    </form>
    <button (click)="toggle()">{{ form.disabled ? 'Enable' : 'Disable' }} Group</button>
    <p>Status: {{ form.status }}</p>
  `
})
class Ex19 {
  form = new FormGroup({ name: new FormControl(''), email: new FormControl('') });
  toggle() { this.form.disabled ? this.form.enable() : this.form.disable(); }
}

// 20. statusChanges subscription
@Component({
  selector: 'ex-20', standalone: true, imports: [ReactiveFormsModule],
  template: `<input [formControl]="ctrl" placeholder="Email" /><p>Status: {{ status }}</p>`
})
class Ex20 implements OnInit {
  ctrl = new FormControl('', [Validators.required, Validators.email]);
  status = '';
  ngOnInit() { this.ctrl.statusChanges.subscribe(s => this.status = s); }
}

// 21. valueChanges with debounce
@Component({
  selector: 'ex-21', standalone: true, imports: [ReactiveFormsModule],
  template: `<input [formControl]="search" placeholder="Search..." /><p>Debounced: {{ debounced }}</p>`
})
class Ex21 implements OnInit {
  search = new FormControl('');
  debounced = '';
  ngOnInit() {
    this.search.valueChanges.pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(v => this.debounced = v ?? '');
  }
}

// 22. form.markAllAsTouched()
@Component({
  selector: 'ex-22', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input formControlName="name" placeholder="Name" />
      <input formControlName="email" placeholder="Email" />
      @if (form.get('name')?.touched && form.get('name')?.invalid) { <small style="color:red">Name required.</small> }
      @if (form.get('email')?.touched && form.get('email')?.invalid) { <small style="color:red">Valid email required.</small> }
    </form>
    <button (click)="form.markAllAsTouched()">Mark All Touched</button>
  `
})
class Ex22 {
  form = new FormGroup({
    name: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
  });
}

// 23. form.markAsDirty()
@Component({
  selector: 'ex-23', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input formControlName="title" placeholder="Title" />
    </form>
    <button (click)="form.markAsDirty()">Mark Dirty</button>
    <button (click)="form.markAsPristine()">Mark Pristine</button>
    <p>Dirty: {{ form.dirty }} | Pristine: {{ form.pristine }}</p>
  `
})
class Ex23 { form = new FormGroup({ title: new FormControl('') }); }

// 24. Typed FormControl<string>
@Component({
  selector: 'ex-24', standalone: true, imports: [ReactiveFormsModule],
  template: `<input [formControl]="name" placeholder="Name" /><p>{{ name.value.toUpperCase() }}</p>`
})
class Ex24 { name = new FormControl<string>('', { nonNullable: true }); }

// 25. Typed FormGroup
@Component({
  selector: 'ex-25', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input formControlName="title" /><input type="number" formControlName="year" />
    </form>
    <p>{{ form.value.title }} ({{ form.value.year }})</p>
  `
})
class Ex25 {
  form = new FormGroup({
    title: new FormControl<string>('', { nonNullable: true }),
    year: new FormControl<number>(2024, { nonNullable: true }),
  });
}

// 26. FormRecord for dynamic keys
@Component({
  selector: 'ex-26', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="record">
      @for (key of keys; track key) {
        <div><label>{{ key }}: <input [formControlName]="key" /></label></div>
      }
    </form>
    <button (click)="addField()">Add field</button>
    <pre>{{ record.value | json }}</pre>
  `
})
class Ex26 {
  keys = ['field1', 'field2'];
  record = new FormRecord<FormControl<string>>({
    field1: new FormControl('', { nonNullable: true }),
    field2: new FormControl('', { nonNullable: true }),
  });
  addField() {
    const key = 'field' + (this.keys.length + 1);
    this.keys.push(key);
    this.record.addControl(key, new FormControl('', { nonNullable: true }));
  }
}

// ─── NESTED (27–38) ───────────────────────────────────────────

// 27. Nested FormGroups (address in profile)
@Component({
  selector: 'ex-27', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="saved = form.value">
      <input formControlName="name" placeholder="Name" />
      <div formGroupName="address">
        <input formControlName="street" placeholder="Street" />
        <input formControlName="city" placeholder="City" />
        <input formControlName="zip" placeholder="ZIP" />
      </div>
      <button type="submit">Save</button>
    </form>
    @if (saved) { <pre>{{ saved | json }}</pre> }
  `
})
class Ex27 {
  constructor(private fb: FormBuilder) {}
  form = this.fb.group({
    name: [''],
    address: this.fb.group({ street: [''], city: [''], zip: [''] }),
  });
  saved: any = null;
}

// 28. FormGroup in FormGroup in FormGroup
@Component({
  selector: 'ex-28', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <div formGroupName="personal">
        <div formGroupName="name">
          <input formControlName="first" placeholder="First" />
          <input formControlName="last" placeholder="Last" />
        </div>
        <input formControlName="dob" type="date" />
      </div>
      <input formControlName="email" placeholder="Email" />
    </form>
    <pre>{{ form.value | json }}</pre>
  `
})
class Ex28 {
  constructor(private fb: FormBuilder) {}
  form = this.fb.group({
    personal: this.fb.group({
      name: this.fb.group({ first: [''], last: [''] }),
      dob: [''],
    }),
    email: [''],
  });
}

// 29. Reactive form with signal sync
@Component({
  selector: 'ex-29', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Type..." />
    <p>Signal: {{ liveValue() }}</p>
    <button (click)="ctrl.setValue('from signal'); liveValue.set('from signal')">Set from signal</button>
  `
})
class Ex29 implements OnInit {
  ctrl = new FormControl('');
  liveValue = signal('');
  ngOnInit() { this.ctrl.valueChanges.subscribe(v => this.liveValue.set(v ?? '')); }
}

// 30. FormGroup across multiple components (parent passes formGroup)
import { Input as NgInput } from '@angular/core';

@Component({
  selector: 'address-fields', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div [formGroup]="group">
      <input formControlName="street" placeholder="Street" />
      <input formControlName="city" placeholder="City" />
    </div>
  `
})
class AddressFields { @NgInput() group!: FormGroup; }

@Component({
  selector: 'ex-30', standalone: true, imports: [ReactiveFormsModule, AddressFields],
  template: `
    <form [formGroup]="form">
      <input formControlName="name" placeholder="Name" />
      <address-fields [group]="addressGroup" />
    </form>
    <pre>{{ form.value | json }}</pre>
  `
})
class Ex30 {
  constructor(private fb: FormBuilder) {}
  form = this.fb.group({ name: [''], street: [''], city: [''] });
  get addressGroup() { return this.fb.group({ street: this.form.get('street')!, city: this.form.get('city')! }); }
}

// 31. Shared FormGroup service pattern
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
class SharedFormService {
  form = new FormGroup({
    preference: new FormControl('dark'),
    language: new FormControl('en'),
  });
}

@Component({
  selector: 'ex-31', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="svc.form">
      <select formControlName="preference">
        <option value="dark">Dark</option><option value="light">Light</option>
      </select>
      <select formControlName="language">
        <option value="en">English</option><option value="fr">French</option>
      </select>
    </form>
    <pre>{{ svc.form.value | json }}</pre>
  `
})
class Ex31 { constructor(public svc: SharedFormService) {} }

// 32. Dynamic field visibility with @if + form control
@Component({
  selector: 'ex-32', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <label><input type="checkbox" [formControl]="showExtra" /> Show extra field</label>
      @if (showExtra.value) {
        <input formControlName="extraField" placeholder="Extra field" />
      }
      <input formControlName="name" placeholder="Name" />
    </form>
    <pre>{{ form.value | json }}</pre>
  `
})
class Ex32 {
  showExtra = new FormControl(false);
  form = new FormGroup({ name: new FormControl(''), extraField: new FormControl('') });
}

// 33. Form with HTTP submission (simulated)
@Component({
  selector: 'ex-33', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <input formControlName="email" placeholder="Email" />
      <input type="password" formControlName="password" placeholder="Password" />
      <button [disabled]="form.invalid || loading">{{ loading ? 'Loading...' : 'Login' }}</button>
    </form>
    @if (error) { <p style="color:red">{{ error }}</p> }
    @if (success) { <p style="color:green">Logged in!</p> }
  `
})
class Ex33 {
  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required),
  });
  loading = false; error = ''; success = false;
  submit() {
    this.loading = true; this.error = '';
    setTimeout(() => { this.loading = false; this.success = true; }, 800);
  }
}

// 34. Form with loading / success / error states
@Component({
  selector: 'ex-34', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <input formControlName="name" placeholder="Name" />
      <button type="submit" [disabled]="state === 'loading'">Submit</button>
    </form>
    @if (state === 'loading') { <p>Loading...</p> }
    @if (state === 'success') { <p style="color:green">Saved!</p> }
    @if (state === 'error') { <p style="color:red">Error occurred.</p> }
  `
})
class Ex34 {
  form = new FormGroup({ name: new FormControl('') });
  state: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  submit() {
    this.state = 'loading';
    setTimeout(() => { this.state = Math.random() > 0.3 ? 'success' : 'error'; }, 600);
  }
}

// 35. Multi-step form across components
@Component({
  selector: 'ex-35', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div>
      @if (step === 1) {
        <form [formGroup]="form">
          <h5>Step 1: Personal Info</h5>
          <input formControlName="name" placeholder="Name" />
          <input formControlName="email" placeholder="Email" />
          <button (click)="step = 2" [disabled]="!form.get('name')?.valid">Next</button>
        </form>
      }
      @if (step === 2) {
        <form [formGroup]="form">
          <h5>Step 2: Address</h5>
          <input formControlName="street" placeholder="Street" />
          <input formControlName="city" placeholder="City" />
          <button (click)="step = 1">Back</button>
          <button (click)="submitted = true">Submit</button>
        </form>
      }
      @if (submitted) { <pre>{{ form.value | json }}</pre> }
    </div>
  `
})
class Ex35 {
  step = 1; submitted = false;
  form = new FormGroup({
    name: new FormControl('', Validators.required),
    email: new FormControl(''),
    street: new FormControl(''),
    city: new FormControl(''),
  });
}

// 36. Form with undo (signal history)
@Component({
  selector: 'ex-36', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Type..." />
    <button (click)="undo()" [disabled]="history().length < 2">Undo</button>
    <p>Value: {{ ctrl.value }}</p>
    <p>History: {{ history() | json }}</p>
  `
})
class Ex36 implements OnInit {
  ctrl = new FormControl('');
  history = signal<string[]>([]);
  ngOnInit() {
    this.ctrl.valueChanges.subscribe(v => {
      this.history.update(h => [...h, v ?? ''].slice(-10));
    });
  }
  undo() {
    this.history.update(h => { const next = h.slice(0, -1); this.ctrl.setValue(next[next.length - 1] ?? '', { emitEvent: false }); return next; });
  }
}

// 37. Conditional validators based on other field
@Component({
  selector: 'ex-37', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <label><input type="checkbox" formControlName="hasWebsite" /> Has website?</label>
      @if (form.get('hasWebsite')?.value) {
        <input formControlName="website" placeholder="https://..." />
        @if (form.get('website')?.invalid && form.get('website')?.touched) {
          <small style="color:red">Required when enabled.</small>
        }
      }
    </form>
    <pre>{{ form.value | json }}</pre>
  `
})
class Ex37 implements OnInit {
  form = new FormGroup({
    hasWebsite: new FormControl(false),
    website: new FormControl(''),
  });
  ngOnInit() {
    this.form.get('hasWebsite')!.valueChanges.subscribe(v => {
      const website = this.form.get('website')!;
      v ? website.setValidators(Validators.required) : website.clearValidators();
      website.updateValueAndValidity();
    });
  }
}

// 38. Form with real-time preview
@Component({
  selector: 'ex-38', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input formControlName="title" placeholder="Title" />
      <input formControlName="subtitle" placeholder="Subtitle" />
      <textarea formControlName="body" rows="3" placeholder="Body..."></textarea>
      <input type="color" formControlName="color" />
    </form>
    <div [style.border-left]="'4px solid ' + (form.value.color || '#ccc')" style="padding:12px;margin-top:8px">
      <h3>{{ form.value.title || 'Title Preview' }}</h3>
      <h5>{{ form.value.subtitle }}</h5>
      <p>{{ form.value.body }}</p>
    </div>
  `
})
class Ex38 {
  form = new FormGroup({
    title: new FormControl(''),
    subtitle: new FormControl(''),
    body: new FormControl(''),
    color: new FormControl('#3f51b5'),
  });
}

// ─── ADVANCED (39–50) ─────────────────────────────────────────

// 39. Strictly typed forms
@Component({
  selector: 'ex-39', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input formControlName="username" /><input type="number" formControlName="age" />
    </form>
    <p>{{ form.value.username?.toUpperCase() }} age {{ form.value.age }}</p>
  `
})
class Ex39 {
  form = new FormGroup({
    username: new FormControl<string>('', { nonNullable: true }),
    age: new FormControl<number>(0, { nonNullable: true }),
  });
}

// 40. NonNullableFormBuilder
@Component({
  selector: 'ex-40', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input formControlName="email" /><input formControlName="role" />
    </form>
    <p>{{ form.getRawValue() | json }}</p>
  `
})
class Ex40 {
  constructor(private fb: NonNullableFormBuilder) {}
  form = this.fb.group({ email: ['', Validators.email], role: ['user'] });
}

// 41. FormControl<string|null>
@Component({
  selector: 'ex-41', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Nullable string" />
    <button (click)="ctrl.reset()">Reset to null</button>
    <p>Value: {{ ctrl.value === null ? 'null' : ctrl.value }}</p>
  `
})
class Ex41 { ctrl = new FormControl<string | null>('initial'); }

// 42. Custom typed form builder
interface LoginForm { email: FormControl<string>; password: FormControl<string>; }

function buildLoginForm(fb: NonNullableFormBuilder): FormGroup<LoginForm> {
  return fb.group<LoginForm>({
    email: fb.control('', [Validators.required, Validators.email]),
    password: fb.control('', [Validators.required, Validators.minLength(6)]),
  });
}

@Component({
  selector: 'ex-42', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input formControlName="email" placeholder="Email" />
      <input type="password" formControlName="password" placeholder="Password" />
    </form>
    <p>Valid: {{ form.valid }}</p>
  `
})
class Ex42 {
  constructor(private fb: NonNullableFormBuilder) {}
  form = buildLoginForm(this.fb);
}

// 43. FormGroup with generics
@Component({
  selector: 'ex-43', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input formControlName="name" placeholder="Product name" />
      <input type="number" formControlName="price" placeholder="Price" />
      <input type="number" formControlName="stock" placeholder="Stock" />
    </form>
    <pre>{{ form.getRawValue() | json }}</pre>
  `
})
class Ex43 {
  form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true }),
    price: new FormControl<number>(0, { nonNullable: true }),
    stock: new FormControl<number>(0, { nonNullable: true }),
  });
}

// 44. Signal + reactive form bidirectional sync
@Component({
  selector: 'ex-44', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <input [formControl]="ctrl" placeholder="Bidirectional" />
    <p>Signal: {{ sig() }}</p>
    <button (click)="setFromSignal('hello from signal')">Set from signal</button>
  `
})
class Ex44 implements OnInit {
  ctrl = new FormControl('', { nonNullable: true });
  sig = signal('');
  ngOnInit() { this.ctrl.valueChanges.subscribe(v => this.sig.set(v)); }
  setFromSignal(v: string) { this.sig.set(v); this.ctrl.setValue(v, { emitEvent: false }); }
}

// 45. Form with optimistic update
@Component({
  selector: 'ex-45', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="save()">
      <input formControlName="username" placeholder="Username" />
      <button type="submit">Save</button>
    </form>
    <p>Saved: {{ savedValue }}</p>
    @if (error) { <p style="color:red">Save failed. Reverted.</p> }
  `
})
class Ex45 {
  form = new FormGroup({ username: new FormControl('jdoe') });
  savedValue = 'jdoe'; error = false;
  save() {
    const prev = this.savedValue;
    this.savedValue = this.form.value.username ?? '';
    this.error = false;
    setTimeout(() => {
      if (Math.random() < 0.4) { this.error = true; this.savedValue = prev; this.form.patchValue({ username: prev }); }
    }, 600);
  }
}

// 46. Form with backend validation errors
@Component({
  selector: 'ex-46', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <input formControlName="email" placeholder="Email (use taken@test.com)" />
      @if (form.get('email')?.errors?.['serverError']) {
        <small style="color:red">{{ form.get('email')?.errors?.['serverError'] }}</small>
      }
      <button type="submit" [disabled]="form.invalid">Submit</button>
    </form>
  `
})
class Ex46 {
  form = new FormGroup({ email: new FormControl('', [Validators.required, Validators.email]) });
  submit() {
    setTimeout(() => {
      if (this.form.value.email === 'taken@test.com') {
        this.form.get('email')!.setErrors({ serverError: 'Email already in use.' });
      }
    }, 400);
  }
}

// 47. Reactive form + CVA composition (preview)
@Component({
  selector: 'ex-47', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input formControlName="title" placeholder="Title" />
      <input type="number" formControlName="rating" min="1" max="5" placeholder="Rating (1-5)" />
    </form>
    <div>
      @for (star of stars; track star) {
        <span [style.color]="star <= (form.value.rating ?? 0) ? 'gold' : 'gray'">★</span>
      }
      <span>{{ form.value.title }}</span>
    </div>
  `
})
class Ex47 {
  stars = [1, 2, 3, 4, 5];
  form = new FormGroup({
    title: new FormControl(''),
    rating: new FormControl<number>(3),
  });
}

// 48. AbstractControl type narrowing
@Component({
  selector: 'ex-48', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input formControlName="name" placeholder="Name" />
    </form>
    <p>Has required error: {{ hasRequired() }}</p>
    <p>Value length: {{ valueLength() }}</p>
  `
})
class Ex48 {
  form = new FormGroup({ name: new FormControl('', Validators.required) });
  hasRequired() { return this.form.get('name')?.hasError('required') ?? false; }
  valueLength() { return (this.form.get('name')?.value?.length ?? 0); }
}

// 49. Form with draft autosave
@Component({
  selector: 'ex-49', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <input formControlName="title" placeholder="Title" />
      <textarea formControlName="content" rows="3" placeholder="Content..."></textarea>
    </form>
    <p>Draft saved: {{ lastSaved }}</p>
    <small>{{ form.value | json }}</small>
  `
})
class Ex49 implements OnInit {
  form = new FormGroup({ title: new FormControl(''), content: new FormControl('') });
  lastSaved = 'Not yet';
  ngOnInit() {
    this.form.valueChanges.pipe(debounceTime(1000)).subscribe(v => {
      this.lastSaved = new Date().toLocaleTimeString();
    });
  }
}

// 50. Full CRUD form (create / edit mode)
@Component({
  selector: 'ex-50', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <div>
      <button (click)="newItem()">New</button>
      @for (item of items; track item.id) {
        <button (click)="edit(item)">Edit: {{ item.name }}</button>
      }
    </div>
    <form [formGroup]="form" (ngSubmit)="save()">
      <input formControlName="name" placeholder="Name" />
      <input formControlName="email" placeholder="Email" />
      <button type="submit" [disabled]="form.invalid">{{ editingId ? 'Update' : 'Create' }}</button>
      @if (editingId) { <button type="button" (click)="cancel()">Cancel</button> }
    </form>
    <ul>@for (item of items; track item.id) { <li>{{ item.name }} — {{ item.email }}</li> }</ul>
  `
})
class Ex50 {
  items: { id: number; name: string; email: string }[] = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
  ];
  editingId: number | null = null;
  form = new FormGroup({
    name: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
  });
  newItem() { this.editingId = null; this.form.reset(); }
  edit(item: { id: number; name: string; email: string }) { this.editingId = item.id; this.form.patchValue(item); }
  cancel() { this.editingId = null; this.form.reset(); }
  save() {
    const v = this.form.value as { name: string; email: string };
    if (this.editingId) {
      this.items = this.items.map(i => i.id === this.editingId ? { ...i, ...v } : i);
    } else {
      this.items.push({ id: Date.now(), name: v.name, email: v.email });
    }
    this.editingId = null; this.form.reset();
  }
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
      <h1>Examples 4.2 — Reactive Forms</h1>
      <h4>1. FormControl single input</h4><ex-01 /><hr />
      <h4>2. FormControl with initial value</h4><ex-02 /><hr />
      <h4>3. FormControl valueChanges</h4><ex-03 /><hr />
      <h4>4. FormGroup simple</h4><ex-04 /><hr />
      <h4>5. FormGroup submission</h4><ex-05 /><hr />
      <h4>6. FormBuilder.group</h4><ex-06 /><hr />
      <h4>7. FormBuilder.control</h4><ex-07 /><hr />
      <h4>8. form.value</h4><ex-08 /><hr />
      <h4>9. form.getRawValue()</h4><ex-09 /><hr />
      <h4>10. form.valid</h4><ex-10 /><hr />
      <h4>11. form.errors</h4><ex-11 /><hr />
      <h4>12. form.reset()</h4><ex-12 /><hr />
      <h4>13. form.patchValue()</h4><ex-13 /><hr />
      <h4>14. FormGroup login</h4><ex-14 /><hr />
      <h4>15. FormGroup profile</h4><ex-15 /><hr />
      <h4>16. FormBuilder with nested group</h4><ex-16 /><hr />
      <h4>17. setValue vs patchValue</h4><ex-17 /><hr />
      <h4>18. Disable / enable control</h4><ex-18 /><hr />
      <h4>19. Disable / enable group</h4><ex-19 /><hr />
      <h4>20. statusChanges subscription</h4><ex-20 /><hr />
      <h4>21. valueChanges with debounce</h4><ex-21 /><hr />
      <h4>22. form.markAllAsTouched()</h4><ex-22 /><hr />
      <h4>23. form.markAsDirty()</h4><ex-23 /><hr />
      <h4>24. Typed FormControl&lt;string&gt;</h4><ex-24 /><hr />
      <h4>25. Typed FormGroup</h4><ex-25 /><hr />
      <h4>26. FormRecord for dynamic keys</h4><ex-26 /><hr />
      <h4>27. Nested FormGroups (address in profile)</h4><ex-27 /><hr />
      <h4>28. FormGroup in FormGroup in FormGroup</h4><ex-28 /><hr />
      <h4>29. Reactive form with signal sync</h4><ex-29 /><hr />
      <h4>30. FormGroup across multiple components</h4><ex-30 /><hr />
      <h4>31. Shared FormGroup service pattern</h4><ex-31 /><hr />
      <h4>32. Dynamic field visibility with @if</h4><ex-32 /><hr />
      <h4>33. Form with HTTP submission (simulated)</h4><ex-33 /><hr />
      <h4>34. Form with loading / success / error states</h4><ex-34 /><hr />
      <h4>35. Multi-step form</h4><ex-35 /><hr />
      <h4>36. Form with undo (signal history)</h4><ex-36 /><hr />
      <h4>37. Conditional validators based on other field</h4><ex-37 /><hr />
      <h4>38. Form with real-time preview</h4><ex-38 /><hr />
      <h4>39. Strictly typed forms</h4><ex-39 /><hr />
      <h4>40. NonNullableFormBuilder</h4><ex-40 /><hr />
      <h4>41. FormControl&lt;string|null&gt;</h4><ex-41 /><hr />
      <h4>42. Custom typed form builder</h4><ex-42 /><hr />
      <h4>43. FormGroup with generics</h4><ex-43 /><hr />
      <h4>44. Signal + reactive form bidirectional sync</h4><ex-44 /><hr />
      <h4>45. Form with optimistic update</h4><ex-45 /><hr />
      <h4>46. Form with backend validation errors</h4><ex-46 /><hr />
      <h4>47. Reactive form + CVA composition</h4><ex-47 /><hr />
      <h4>48. AbstractControl type narrowing</h4><ex-48 /><hr />
      <h4>49. Form with draft autosave</h4><ex-49 /><hr />
      <h4>50. Full CRUD form (create / edit mode)</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
