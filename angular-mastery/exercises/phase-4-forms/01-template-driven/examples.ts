import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

// ============================================================
// Examples 4.1 — Template-Driven Forms (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ────────────────────────────────────────────

// 1. [(ngModel)] on text input
@Component({
  selector: 'ex-01', standalone: true, imports: [FormsModule],
  template: `<input [(ngModel)]="name" placeholder="Name" /><p>{{ name }}</p>`
})
class Ex01 { name = ''; }

// 2. ngModel on number input
@Component({
  selector: 'ex-02', standalone: true, imports: [FormsModule],
  template: `<input type="number" [(ngModel)]="age" /><p>Age: {{ age }}</p>`
})
class Ex02 { age = 0; }

// 3. ngModel on checkbox
@Component({
  selector: 'ex-03', standalone: true, imports: [FormsModule],
  template: `<label><input type="checkbox" [(ngModel)]="accepted" /> Accept terms</label><p>Accepted: {{ accepted }}</p>`
})
class Ex03 { accepted = false; }

// 4. ngModel on radio
@Component({
  selector: 'ex-04', standalone: true, imports: [FormsModule],
  template: `
    <label><input type="radio" name="size" [(ngModel)]="size" value="S" /> S</label>
    <label><input type="radio" name="size" [(ngModel)]="size" value="M" /> M</label>
    <label><input type="radio" name="size" [(ngModel)]="size" value="L" /> L</label>
    <p>Size: {{ size }}</p>
  `
})
class Ex04 { size = 'M'; }

// 5. ngModel on select
@Component({
  selector: 'ex-05', standalone: true, imports: [FormsModule],
  template: `
    <select [(ngModel)]="country">
      <option value="US">United States</option>
      <option value="UK">United Kingdom</option>
      <option value="CA">Canada</option>
    </select>
    <p>Country: {{ country }}</p>
  `
})
class Ex05 { country = 'US'; }

// 6. ngModel on textarea
@Component({
  selector: 'ex-06', standalone: true, imports: [FormsModule],
  template: `<textarea [(ngModel)]="bio" rows="3" placeholder="Bio..."></textarea><p>{{ bio }}</p>`
})
class Ex06 { bio = ''; }

// 7. ngModel two-way display
@Component({
  selector: 'ex-07', standalone: true, imports: [FormsModule],
  template: `
    <input [(ngModel)]="text" placeholder="Type..." />
    <p>Live: <strong>{{ text }}</strong></p>
  `
})
class Ex07 { text = ''; }

// 8. ngModel with initial value
@Component({
  selector: 'ex-08', standalone: true, imports: [FormsModule],
  template: `<input [(ngModel)]="username" /><p>{{ username }}</p>`
})
class Ex08 { username = 'jdoe'; }

// 9. #form="ngForm" access
@Component({
  selector: 'ex-09', standalone: true, imports: [FormsModule],
  template: `
    <form #f="ngForm">
      <input name="val" ngModel />
      <p>Dirty: {{ f.dirty }} | Touched: {{ f.touched }}</p>
    </form>
  `
})
class Ex09 {}

// 10. form.valid / form.invalid
@Component({
  selector: 'ex-10', standalone: true, imports: [FormsModule],
  template: `
    <form #f="ngForm">
      <input name="email" ngModel required email />
      <p>Valid: {{ f.valid }} | Invalid: {{ f.invalid }}</p>
    </form>
  `
})
class Ex10 {}

// 11. form.dirty / form.pristine
@Component({
  selector: 'ex-11', standalone: true, imports: [FormsModule],
  template: `
    <form #f="ngForm">
      <input name="field" ngModel />
      <p>Dirty: {{ f.dirty }} | Pristine: {{ f.pristine }}</p>
    </form>
  `
})
class Ex11 {}

// 12. Template submit handler
@Component({
  selector: 'ex-12', standalone: true, imports: [FormsModule],
  template: `
    <form #f="ngForm" (ngSubmit)="onSubmit(f.value)">
      <input name="title" ngModel placeholder="Title" />
      <button type="submit">Submit</button>
    </form>
    <p>Submitted: {{ result }}</p>
  `
})
class Ex12 {
  result = '';
  onSubmit(val: any) { this.result = JSON.stringify(val); }
}

// 13. ngForm reset
@Component({
  selector: 'ex-13', standalone: true, imports: [FormsModule],
  template: `
    <form #f="ngForm" (ngSubmit)="onSubmit(f)">
      <input name="item" ngModel placeholder="Item" />
      <button type="submit">Submit</button>
      <button type="button" (click)="f.reset()">Reset</button>
    </form>
    <p>Value: {{ last }}</p>
  `
})
class Ex13 {
  last = '';
  onSubmit(f: any) { this.last = JSON.stringify(f.value); f.reset(); }
}

// ─── INTERMEDIATE (14–26) ─────────────────────────────────────

// 14. ngModel with required validation
@Component({
  selector: 'ex-14', standalone: true, imports: [FormsModule],
  template: `
    <form #f="ngForm">
      <input name="name" ngModel required #n="ngModel" />
      @if (n.invalid && n.touched) { <small style="color:red">Name is required.</small> }
      <button type="submit" [disabled]="f.invalid">Submit</button>
    </form>
  `
})
class Ex14 {}

// 15. ngModel with minlength
@Component({
  selector: 'ex-15', standalone: true, imports: [FormsModule],
  template: `
    <input name="pass" ngModel required minlength="6" #p="ngModel" placeholder="Password" />
    @if (p.errors?.['minlength'] && p.touched) {
      <small style="color:red">Min 6 characters.</small>
    }
  `
})
class Ex15 {}

// 16. ngModel email validator
@Component({
  selector: 'ex-16', standalone: true, imports: [FormsModule],
  template: `
    <input name="email" ngModel email #e="ngModel" placeholder="Email" />
    @if (e.errors?.['email'] && e.touched) { <small style="color:red">Invalid email.</small> }
    @if (e.valid && e.value) { <small style="color:green">Valid email.</small> }
  `
})
class Ex16 {}

// 17. ngModel pattern validator
@Component({
  selector: 'ex-17', standalone: true, imports: [FormsModule],
  template: `
    <input name="zip" ngModel pattern="\\d{5}" #z="ngModel" placeholder="ZIP (5 digits)" />
    @if (z.errors?.['pattern'] && z.touched) { <small style="color:red">Must be 5 digits.</small> }
  `
})
class Ex17 {}

// 18. ngModel error messages with #field
@Component({
  selector: 'ex-18', standalone: true, imports: [FormsModule],
  template: `
    <input name="username" ngModel required minlength="3" maxlength="15" #u="ngModel" placeholder="Username" />
    @if (u.touched) {
      @if (u.errors?.['required']) { <p style="color:red">Required.</p> }
      @if (u.errors?.['minlength']) { <p style="color:red">Too short.</p> }
    }
  `
})
class Ex18 {}

// 19. Disable submit when invalid
@Component({
  selector: 'ex-19', standalone: true, imports: [FormsModule],
  template: `
    <form #f="ngForm" (ngSubmit)="submitted = true">
      <input name="email" ngModel required email placeholder="Email" />
      <button [disabled]="f.invalid">Send</button>
    </form>
    @if (submitted) { <p>Submitted!</p> }
  `
})
class Ex19 { submitted = false; }

// 20. Select with options from array
@Component({
  selector: 'ex-20', standalone: true, imports: [FormsModule],
  template: `
    <select name="lang" [(ngModel)]="selected">
      @for (l of langs; track l) { <option [value]="l">{{ l }}</option> }
    </select>
    <p>Selected: {{ selected }}</p>
  `
})
class Ex20 { langs = ['TypeScript', 'JavaScript', 'Python', 'Rust']; selected = 'TypeScript'; }

// 21. Checkbox group with ngModel
@Component({
  selector: 'ex-21', standalone: true, imports: [FormsModule],
  template: `
    <label><input type="checkbox" [(ngModel)]="prefs.dark" name="dark" /> Dark mode</label>
    <label><input type="checkbox" [(ngModel)]="prefs.notifications" name="notif" /> Notifications</label>
    <label><input type="checkbox" [(ngModel)]="prefs.newsletter" name="news" /> Newsletter</label>
    <pre>{{ prefs | json }}</pre>
  `
})
class Ex21 { prefs = { dark: false, notifications: true, newsletter: false }; }

// 22. Radio group with ngModel
@Component({
  selector: 'ex-22', standalone: true, imports: [FormsModule],
  template: `
    @for (opt of options; track opt) {
      <label><input type="radio" [(ngModel)]="selected" name="plan" [value]="opt" /> {{ opt }}</label>
    }
    <p>Plan: {{ selected }}</p>
  `
})
class Ex22 { options = ['Free', 'Pro', 'Enterprise']; selected = 'Free'; }

// 23. ngModel on date input
@Component({
  selector: 'ex-23', standalone: true, imports: [FormsModule],
  template: `<input type="date" name="dob" [(ngModel)]="dob" /><p>DOB: {{ dob }}</p>`
})
class Ex23 { dob = '2000-01-01'; }

// 24. ngModel on range input
@Component({
  selector: 'ex-24', standalone: true, imports: [FormsModule],
  template: `<input type="range" name="vol" [(ngModel)]="volume" min="0" max="100" /><p>Volume: {{ volume }}</p>`
})
class Ex24 { volume = 50; }

// 25. ngModel on color input
@Component({
  selector: 'ex-25', standalone: true, imports: [FormsModule],
  template: `<input type="color" name="color" [(ngModel)]="color" /><div [style.background]="color" style="width:60px;height:30px;display:inline-block;margin-left:8px"></div>`
})
class Ex25 { color = '#3f51b5'; }

// 26. ngModel on file input (display filename)
@Component({
  selector: 'ex-26', standalone: true, imports: [FormsModule],
  template: `
    <input type="file" (change)="onFile($event)" />
    <p>File: {{ filename || 'none' }}</p>
  `
})
class Ex26 {
  filename = '';
  onFile(e: Event) { this.filename = (e.target as HTMLInputElement).files?.[0]?.name ?? ''; }
}

// ─── NESTED (27–38) ───────────────────────────────────────────

// 27. Login form (email + password)
@Component({
  selector: 'ex-27', standalone: true, imports: [FormsModule],
  template: `
    <form #f="ngForm" (ngSubmit)="onSubmit(f.value)">
      <input name="email" ngModel required email placeholder="Email" /><br />
      <input name="password" type="password" ngModel required minlength="6" placeholder="Password" /><br />
      <button [disabled]="f.invalid">Login</button>
    </form>
    @if (result) { <pre>{{ result }}</pre> }
  `
})
class Ex27 {
  result = '';
  onSubmit(v: any) { this.result = JSON.stringify(v); }
}

// 28. Registration form (name + email + pass + confirm)
@Component({
  selector: 'ex-28', standalone: true, imports: [FormsModule],
  template: `
    <form #f="ngForm" (ngSubmit)="onSubmit(f.value)">
      <input name="name" ngModel required placeholder="Full Name" /><br />
      <input name="email" ngModel required email placeholder="Email" /><br />
      <input name="password" ngModel required minlength="8" placeholder="Password" /><br />
      <input name="confirm" ngModel required placeholder="Confirm Password" /><br />
      <button [disabled]="f.invalid">Register</button>
    </form>
    @if (result) { <pre>{{ result }}</pre> }
  `
})
class Ex28 {
  result = '';
  onSubmit(v: any) { this.result = JSON.stringify(v); }
}

// 29. Profile form (multiple fields)
@Component({
  selector: 'ex-29', standalone: true, imports: [FormsModule],
  template: `
    <form #f="ngForm" (ngSubmit)="saved = f.value">
      <input name="firstName" ngModel placeholder="First Name" /><br />
      <input name="lastName" ngModel placeholder="Last Name" /><br />
      <input name="phone" ngModel placeholder="Phone" /><br />
      <select name="role" ngModel>
        <option value="admin">Admin</option><option value="user">User</option>
      </select><br />
      <button type="submit">Save</button>
    </form>
    @if (saved) { <pre>{{ saved | json }}</pre> }
  `
})
class Ex29 { saved: any = null; }

// 30. Contact form with textarea
@Component({
  selector: 'ex-30', standalone: true, imports: [FormsModule],
  template: `
    <form #f="ngForm" (ngSubmit)="onSubmit(f.value)">
      <input name="name" ngModel required placeholder="Your Name" /><br />
      <input name="email" ngModel required email placeholder="Email" /><br />
      <input name="subject" ngModel required placeholder="Subject" /><br />
      <textarea name="message" ngModel required rows="4" placeholder="Message..."></textarea><br />
      <button [disabled]="f.invalid">Send</button>
    </form>
    @if (sent) { <p style="color:green">Message sent!</p> }
  `
})
class Ex30 {
  sent = false;
  onSubmit(v: any) { console.log(v); this.sent = true; }
}

// 31. Preference form with checkboxes
@Component({
  selector: 'ex-31', standalone: true, imports: [FormsModule],
  template: `
    <form #f="ngForm" (ngSubmit)="prefs = f.value">
      <label><input type="checkbox" name="email_notif" ngModel /> Email notifications</label><br />
      <label><input type="checkbox" name="sms_notif" ngModel /> SMS notifications</label><br />
      <label><input type="checkbox" name="weekly_digest" ngModel /> Weekly digest</label><br />
      <label><input type="checkbox" name="beta_features" ngModel /> Beta features</label><br />
      <button type="submit">Save Preferences</button>
    </form>
    @if (prefs) { <pre>{{ prefs | json }}</pre> }
  `
})
class Ex31 { prefs: any = null; }

// 32. Address form — nested object via ngModelGroup
@Component({
  selector: 'ex-32', standalone: true, imports: [FormsModule],
  template: `
    <form #f="ngForm" (ngSubmit)="addr = f.value">
      <div ngModelGroup="address">
        <input name="street" ngModel placeholder="Street" /><br />
        <input name="city" ngModel placeholder="City" /><br />
        <input name="state" ngModel placeholder="State" /><br />
        <input name="zip" ngModel placeholder="ZIP" />
      </div>
      <button type="submit">Save</button>
    </form>
    @if (addr) { <pre>{{ addr | json }}</pre> }
  `
})
class Ex32 { addr: any = null; }

// 33. Survey form with radios
@Component({
  selector: 'ex-33', standalone: true, imports: [FormsModule],
  template: `
    <form #f="ngForm" (ngSubmit)="answers = f.value">
      <p>How satisfied are you?</p>
      @for (opt of satisfaction; track opt) {
        <label><input type="radio" name="satisfaction" [(ngModel)]="sat" [value]="opt" /> {{ opt }}</label>
      }
      <p>Would you recommend?</p>
      <label><input type="radio" name="recommend" [(ngModel)]="rec" value="yes" /> Yes</label>
      <label><input type="radio" name="recommend" [(ngModel)]="rec" value="no" /> No</label>
      <button type="submit">Submit</button>
    </form>
    @if (answers) { <pre>{{ answers | json }}</pre> }
  `
})
class Ex33 {
  satisfaction = ['Very satisfied', 'Satisfied', 'Neutral', 'Dissatisfied'];
  sat = ''; rec = ''; answers: any = null;
}

// 34. Search form with select + text
@Component({
  selector: 'ex-34', standalone: true, imports: [FormsModule],
  template: `
    <form #f="ngForm" (ngSubmit)="query = f.value">
      <select name="category" ngModel>
        @for (c of categories; track c) { <option [value]="c">{{ c }}</option> }
      </select>
      <input name="term" ngModel placeholder="Search term..." />
      <button type="submit">Search</button>
    </form>
    @if (query) { <p>Searching {{ query.category }} for "{{ query.term }}"</p> }
  `
})
class Ex34 {
  categories = ['All', 'Books', 'Electronics', 'Clothing'];
  query: any = null;
}

// 35. Settings form with toggle switches
@Component({
  selector: 'ex-35', standalone: true, imports: [FormsModule],
  template: `
    <form #f="ngForm">
      @for (key of settingKeys; track key) {
        <div style="display:flex;align-items:center;gap:8px;margin:4px 0">
          <input type="checkbox" [name]="key" [(ngModel)]="settings[key]" [id]="key" />
          <label [for]="key">{{ key }}</label>
        </div>
      }
    </form>
    <pre>{{ settings | json }}</pre>
  `
})
class Ex35 {
  settings: Record<string, boolean> = { darkMode: false, autoSave: true, twoFactor: false, analytics: true };
  get settingKeys() { return Object.keys(this.settings); }
}

// 36. Filter form (multiple select + checkbox)
@Component({
  selector: 'ex-36', standalone: true, imports: [FormsModule],
  template: `
    <form #f="ngForm" (ngSubmit)="filters = f.value">
      <select name="status" ngModel>
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      <select name="type" ngModel>
        <option value="">All types</option>
        <option value="admin">Admin</option>
        <option value="user">User</option>
      </select>
      <label><input type="checkbox" name="verified" ngModel /> Verified only</label>
      <button type="submit">Apply</button>
    </form>
    @if (filters) { <pre>{{ filters | json }}</pre> }
  `
})
class Ex36 { filters: any = null; }

// 37. Order form with quantity + size + color
@Component({
  selector: 'ex-37', standalone: true, imports: [FormsModule],
  template: `
    <form #f="ngForm" (ngSubmit)="order = f.value">
      <input type="number" name="qty" ngModel min="1" max="99" value="1" />
      <select name="size" ngModel>
        @for (s of sizes; track s) { <option [value]="s">{{ s }}</option> }
      </select>
      <select name="color" ngModel>
        @for (c of colors; track c) { <option [value]="c">{{ c }}</option> }
      </select>
      <button type="submit">Add to cart</button>
    </form>
    @if (order) { <pre>{{ order | json }}</pre> }
  `
})
class Ex37 {
  sizes = ['XS', 'S', 'M', 'L', 'XL'];
  colors = ['Black', 'White', 'Navy', 'Red'];
  order: any = null;
}

// 38. Booking form with date + time + guests
@Component({
  selector: 'ex-38', standalone: true, imports: [FormsModule],
  template: `
    <form #f="ngForm" (ngSubmit)="booking = f.value">
      <input name="name" ngModel required placeholder="Name" /><br />
      <input type="date" name="date" ngModel required /><br />
      <input type="time" name="time" ngModel required /><br />
      <input type="number" name="guests" ngModel min="1" max="20" placeholder="Guests" /><br />
      <textarea name="notes" ngModel placeholder="Special requests..."></textarea><br />
      <button [disabled]="f.invalid">Book</button>
    </form>
    @if (booking) { <pre>{{ booking | json }}</pre> }
  `
})
class Ex38 { booking: any = null; }

// ─── ADVANCED (39–50) ─────────────────────────────────────────

// 39. ngModel with custom validator directive
import { Directive, forwardRef } from '@angular/core';
import { NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms';

@Directive({
  selector: '[noSpaces]',
  standalone: true,
  providers: [{ provide: NG_VALIDATORS, useExisting: forwardRef(() => NoSpacesValidator), multi: true }]
})
class NoSpacesValidator implements Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    return control.value?.includes(' ') ? { noSpaces: true } : null;
  }
}

@Component({
  selector: 'ex-39', standalone: true, imports: [FormsModule, NoSpacesValidator],
  template: `
    <input name="handle" ngModel noSpaces required #h="ngModel" placeholder="Handle (no spaces)" />
    @if (h.errors?.['noSpaces']) { <small style="color:red">No spaces allowed.</small> }
    @if (h.valid && h.value) { <small style="color:green">Looks good!</small> }
  `
})
class Ex39 {}

// 40. ngModel with async validator
import { AsyncValidator, NG_ASYNC_VALIDATORS } from '@angular/forms';
import { Observable, of, delay, map } from 'rxjs';

@Directive({
  selector: '[uniqueUsername]',
  standalone: true,
  providers: [{ provide: NG_ASYNC_VALIDATORS, useExisting: forwardRef(() => UniqueUsernameValidator), multi: true }]
})
class UniqueUsernameValidator implements AsyncValidator {
  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    const taken = ['admin', 'root', 'user'];
    return of(taken.includes(control.value?.toLowerCase()) ? { uniqueUsername: true } : null).pipe(delay(400));
  }
}

@Component({
  selector: 'ex-40', standalone: true, imports: [FormsModule, UniqueUsernameValidator],
  template: `
    <input name="username" ngModel uniqueUsername #u="ngModel" placeholder="Username" />
    @if (u.pending) { <small>Checking...</small> }
    @if (u.errors?.['uniqueUsername']) { <small style="color:red">Username taken.</small> }
    @if (u.valid && u.value) { <small style="color:green">Available!</small> }
  `
})
class Ex40 {}

// 41. ngModelGroup for nested object
@Component({
  selector: 'ex-41', standalone: true, imports: [FormsModule],
  template: `
    <form #f="ngForm" (ngSubmit)="data = f.value">
      <div ngModelGroup="user">
        <input name="name" ngModel placeholder="Name" />
        <input name="email" ngModel email placeholder="Email" />
      </div>
      <div ngModelGroup="address">
        <input name="city" ngModel placeholder="City" />
        <input name="country" ngModel placeholder="Country" />
      </div>
      <button type="submit">Submit</button>
    </form>
    @if (data) { <pre>{{ data | json }}</pre> }
  `
})
class Ex41 { data: any = null; }

// 42. ngForm with ngModelGroup
@Component({
  selector: 'ex-42', standalone: true, imports: [FormsModule],
  template: `
    <form #f="ngForm" (ngSubmit)="result = f.value">
      <div ngModelGroup="personal" #pg="ngModelGroup">
        <input name="first" ngModel required placeholder="First" />
        <input name="last" ngModel required placeholder="Last" />
        <p>Personal group valid: {{ pg.valid }}</p>
      </div>
      <input name="email" ngModel required email placeholder="Email" />
      <button [disabled]="f.invalid">Submit</button>
    </form>
    @if (result) { <pre>{{ result | json }}</pre> }
  `
})
class Ex42 { result: any = null; }

// 43. Form with dynamic ngModel fields
@Component({
  selector: 'ex-43', standalone: true, imports: [FormsModule],
  template: `
    <button (click)="addField()">Add Field</button>
    <form #f="ngForm" (ngSubmit)="vals = f.value">
      @for (field of fields; track field; let i = $index) {
        <div>
          <input [name]="'field_' + i" ngModel [placeholder]="'Field ' + (i + 1)" />
          <button type="button" (click)="removeField(i)">×</button>
        </div>
      }
      <button type="submit">Submit</button>
    </form>
    @if (vals) { <pre>{{ vals | json }}</pre> }
  `
})
class Ex43 {
  fields: string[] = [''];
  vals: any = null;
  addField() { this.fields.push(''); }
  removeField(i: number) { this.fields.splice(i, 1); }
}

// 44. ngModel + signal sync pattern
@Component({
  selector: 'ex-44', standalone: true, imports: [FormsModule],
  template: `
    <input [(ngModel)]="name" (ngModelChange)="nameSignal.set($event)" name="name" placeholder="Name" />
    <p>Signal value: {{ nameSignal() }}</p>
    <button (click)="nameSignal.set('Alice'); name = 'Alice'">Set Alice</button>
  `
})
class Ex44 { name = ''; nameSignal = signal(''); }

// 45. ngModel with debounce pattern
@Component({
  selector: 'ex-45', standalone: true, imports: [FormsModule],
  template: `
    <input [ngModel]="raw" (ngModelChange)="onInput($event)" name="search" placeholder="Search (debounced)..." />
    <p>Debounced: {{ debounced }}</p>
  `
})
class Ex45 {
  raw = ''; debounced = '';
  private timer: any;
  onInput(val: string) {
    this.raw = val;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.debounced = val; }, 400);
  }
}

// 46. ngForm cross-field validation
@Component({
  selector: 'ex-46', standalone: true, imports: [FormsModule],
  template: `
    <form #f="ngForm" (ngSubmit)="onSubmit()">
      <input name="password" [(ngModel)]="pw" required placeholder="Password" />
      <input name="confirm" [(ngModel)]="conf" required placeholder="Confirm" />
      @if (f.submitted && pw !== conf) { <p style="color:red">Passwords do not match.</p> }
      <button type="submit">Submit</button>
    </form>
    @if (ok) { <p style="color:green">Submitted!</p> }
  `
})
class Ex46 {
  pw = ''; conf = ''; ok = false;
  onSubmit() { if (this.pw === this.conf) this.ok = true; }
}

// 47. Form with server error display
@Component({
  selector: 'ex-47', standalone: true, imports: [FormsModule],
  template: `
    <form #f="ngForm" (ngSubmit)="onSubmit(f.value)">
      <input name="email" ngModel required email placeholder="Email" />
      <button [disabled]="f.invalid || loading">{{ loading ? 'Submitting...' : 'Submit' }}</button>
    </form>
    @if (serverError) { <p style="color:red">{{ serverError }}</p> }
    @if (success) { <p style="color:green">Success!</p> }
  `
})
class Ex47 {
  loading = false; serverError = ''; success = false;
  onSubmit(v: any) {
    this.loading = true; this.serverError = '';
    setTimeout(() => {
      this.loading = false;
      if (v.email === 'taken@example.com') { this.serverError = 'Email already registered.'; }
      else { this.success = true; }
    }, 800);
  }
}

// 48. ngModel with transform (number formatting)
@Component({
  selector: 'ex-48', standalone: true, imports: [FormsModule],
  template: `
    <input [ngModel]="displayValue" (ngModelChange)="onInput($event)" name="amount" placeholder="Amount" />
    <p>Raw number: {{ rawValue }}</p>
  `
})
class Ex48 {
  rawValue = 0;
  get displayValue() { return this.rawValue ? this.rawValue.toLocaleString() : ''; }
  onInput(val: string) { this.rawValue = Number(val.replace(/,/g, '')) || 0; }
}

// 49. Autosave on blur pattern
@Component({
  selector: 'ex-49', standalone: true, imports: [FormsModule],
  template: `
    <form>
      <input name="title" [(ngModel)]="title" (blur)="autosave()" placeholder="Title (autosaves on blur)" />
      <textarea name="body" [(ngModel)]="body" (blur)="autosave()" rows="3" placeholder="Body..."></textarea>
    </form>
    <p>Last saved: {{ lastSaved || 'Not yet saved' }}</p>
  `
})
class Ex49 {
  title = ''; body = ''; lastSaved = '';
  autosave() { this.lastSaved = new Date().toLocaleTimeString(); }
}

// 50. Full validated registration form with all error states
@Component({
  selector: 'ex-50', standalone: true, imports: [FormsModule],
  template: `
    <form #f="ngForm" (ngSubmit)="onSubmit(f)">
      <div>
        <input name="fullName" ngModel required minlength="2" #fn="ngModel" placeholder="Full Name" />
        @if (fn.touched && fn.errors?.['required']) { <small style="color:red">Required.</small> }
        @if (fn.touched && fn.errors?.['minlength']) { <small style="color:red">Min 2 chars.</small> }
      </div>
      <div>
        <input name="email" ngModel required email #em="ngModel" placeholder="Email" />
        @if (em.touched && em.errors?.['required']) { <small style="color:red">Required.</small> }
        @if (em.touched && em.errors?.['email']) { <small style="color:red">Invalid email.</small> }
      </div>
      <div>
        <input name="password" type="password" ngModel required minlength="8" #pw="ngModel" placeholder="Password" />
        @if (pw.touched && pw.errors?.['required']) { <small style="color:red">Required.</small> }
        @if (pw.touched && pw.errors?.['minlength']) { <small style="color:red">Min 8 chars.</small> }
      </div>
      <div>
        <input name="phone" ngModel pattern="\\d{10}" #ph="ngModel" placeholder="Phone (10 digits)" />
        @if (ph.touched && ph.errors?.['pattern']) { <small style="color:red">10 digits only.</small> }
      </div>
      <div>
        <label><input type="checkbox" name="terms" ngModel required #t="ngModel" /> Accept Terms</label>
        @if (t.touched && t.errors?.['required']) { <small style="color:red">Must accept terms.</small> }
      </div>
      <button [disabled]="f.invalid">Register</button>
    </form>
    @if (done) { <p style="color:green">Registered successfully!</p> }
  `
})
class Ex50 {
  done = false;
  onSubmit(f: any) { if (f.valid) { this.done = true; f.reset(); } }
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
      <h1>Examples 4.1 — Template-Driven Forms</h1>
      <h4>1. [(ngModel)] on text input</h4><ex-01 /><hr />
      <h4>2. ngModel on number input</h4><ex-02 /><hr />
      <h4>3. ngModel on checkbox</h4><ex-03 /><hr />
      <h4>4. ngModel on radio</h4><ex-04 /><hr />
      <h4>5. ngModel on select</h4><ex-05 /><hr />
      <h4>6. ngModel on textarea</h4><ex-06 /><hr />
      <h4>7. ngModel two-way display</h4><ex-07 /><hr />
      <h4>8. ngModel with initial value</h4><ex-08 /><hr />
      <h4>9. #form="ngForm" access</h4><ex-09 /><hr />
      <h4>10. form.valid / form.invalid</h4><ex-10 /><hr />
      <h4>11. form.dirty / form.pristine</h4><ex-11 /><hr />
      <h4>12. Template submit handler</h4><ex-12 /><hr />
      <h4>13. ngForm reset</h4><ex-13 /><hr />
      <h4>14. ngModel with required validation</h4><ex-14 /><hr />
      <h4>15. ngModel with minlength</h4><ex-15 /><hr />
      <h4>16. ngModel email validator</h4><ex-16 /><hr />
      <h4>17. ngModel pattern validator</h4><ex-17 /><hr />
      <h4>18. ngModel error messages with #field</h4><ex-18 /><hr />
      <h4>19. Disable submit when invalid</h4><ex-19 /><hr />
      <h4>20. Select with options from array</h4><ex-20 /><hr />
      <h4>21. Checkbox group with ngModel</h4><ex-21 /><hr />
      <h4>22. Radio group with ngModel</h4><ex-22 /><hr />
      <h4>23. ngModel on date input</h4><ex-23 /><hr />
      <h4>24. ngModel on range input</h4><ex-24 /><hr />
      <h4>25. ngModel on color input</h4><ex-25 /><hr />
      <h4>26. ngModel on file input (display filename)</h4><ex-26 /><hr />
      <h4>27. Login form (email + password)</h4><ex-27 /><hr />
      <h4>28. Registration form</h4><ex-28 /><hr />
      <h4>29. Profile form (multiple fields)</h4><ex-29 /><hr />
      <h4>30. Contact form with textarea</h4><ex-30 /><hr />
      <h4>31. Preference form with checkboxes</h4><ex-31 /><hr />
      <h4>32. Address form with ngModelGroup</h4><ex-32 /><hr />
      <h4>33. Survey form with radios</h4><ex-33 /><hr />
      <h4>34. Search form with select + text</h4><ex-34 /><hr />
      <h4>35. Settings form with toggle switches</h4><ex-35 /><hr />
      <h4>36. Filter form (multiple select + checkbox)</h4><ex-36 /><hr />
      <h4>37. Order form with quantity + size + color</h4><ex-37 /><hr />
      <h4>38. Booking form with date + time + guests</h4><ex-38 /><hr />
      <h4>39. ngModel with custom validator directive</h4><ex-39 /><hr />
      <h4>40. ngModel with async validator</h4><ex-40 /><hr />
      <h4>41. ngModelGroup for nested object</h4><ex-41 /><hr />
      <h4>42. ngForm with ngModelGroup</h4><ex-42 /><hr />
      <h4>43. Form with dynamic ngModel fields</h4><ex-43 /><hr />
      <h4>44. ngModel + signal sync pattern</h4><ex-44 /><hr />
      <h4>45. ngModel with debounce pattern</h4><ex-45 /><hr />
      <h4>46. ngForm cross-field validation</h4><ex-46 /><hr />
      <h4>47. Form with server error display</h4><ex-47 /><hr />
      <h4>48. ngModel with transform (number formatting)</h4><ex-48 /><hr />
      <h4>49. Autosave on blur pattern</h4><ex-49 /><hr />
      <h4>50. Full validated registration form with all error states</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
