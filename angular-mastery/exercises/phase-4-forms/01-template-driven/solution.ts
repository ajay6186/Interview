import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

// ============================================================
// Solution 4.1 — Template-Driven Forms
// ============================================================

// SOLUTION 1: Simple ngModel binding
@Component({
  selector: 'app-simple-form',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Simple Form (ngModel)</h3>
      <form (ngSubmit)="onSubmit()">
        <div><label>Name: <input [(ngModel)]="name" name="name" /></label></div>
        <div><label>Email: <input [(ngModel)]="email" name="email" /></label></div>
        <div><label>Message: <textarea [(ngModel)]="message" name="message"></textarea></label></div>
        <button type="submit">Submit</button>
      </form>
      <p>Hello {{ name || '...' }}!</p>
    </section>
  `,
})
class SimpleFormComponent {
  name = ''; email = ''; message = '';
  onSubmit() { console.log({ name: this.name, email: this.email, message: this.message }); }
}

// SOLUTION 2: Login form with ngForm validation
@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Login Form (ngForm + validation)</h3>
      <form #loginForm="ngForm" (ngSubmit)="onLogin(loginForm.value)">
        <div>
          <label>Email:
            <input name="email" type="email" [(ngModel)]="loginData.email"
                   required email #emailRef="ngModel" />
          </label>
          @if (emailRef.invalid && emailRef.touched) {
            <span style="color:red"> Invalid email</span>
          }
        </div>
        <div>
          <label>Password:
            <input name="password" type="password" [(ngModel)]="loginData.password"
                   required minlength="8" #pwRef="ngModel" />
          </label>
          @if (pwRef.invalid && pwRef.touched) {
            <span style="color:red"> Min 8 characters</span>
          }
        </div>
        <button type="submit" [disabled]="loginForm.invalid">Login</button>
      </form>
    </section>
  `,
})
class LoginFormComponent {
  loginData = { email: '', password: '' };
  onLogin(val: unknown) { console.log('Login:', val); }
}

// SOLUTION 3: Select and checkbox
@Component({
  selector: 'app-select-checkbox',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Select &amp; Checkbox</h3>
      <label>Role:
        <select [(ngModel)]="selectedRole" name="role">
          <option value="admin">Admin</option>
          <option value="user">User</option>
          <option value="guest">Guest</option>
        </select>
      </label><br />
      <label><input type="checkbox" [(ngModel)]="notifications" name="notif" /> Notifications</label><br />
      <label><input type="checkbox" [(ngModel)]="terms" name="terms" /> Accept Terms</label>
      <p>Role: {{ selectedRole }} | Notifications: {{ notifications }} | Terms: {{ terms }}</p>
    </section>
  `,
})
class SelectAndCheckboxComponent {
  selectedRole = 'user';
  notifications = false;
  terms = false;
}

// SOLUTION 4: Two-way binding live preview
@Component({
  selector: 'app-two-way',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Two-Way Binding — Live Preview</h3>
      <textarea [(ngModel)]="text" name="text" rows="3" cols="40" placeholder="Start typing..."></textarea>
      <p>Characters: {{ text.length }}</p>
      <blockquote>{{ text || '(empty)' }}</blockquote>
    </section>
  `,
})
class TwoWayBindingComponent {
  text = '';
}

// SOLUTION 5: Template validation with error messages
@Component({
  selector: 'app-template-validation',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Template Validation</h3>
      <form #f="ngForm" (ngSubmit)="onSubmit(f.value)">
        <div>
          <label>Username:
            <input name="username" [(ngModel)]="username" required minlength="3" maxlength="20" #u="ngModel" />
          </label>
          @if (u.errors?.['required'] && u.touched) { <span style="color:red"> Required</span> }
          @if (u.errors?.['minlength'] && u.touched) { <span style="color:red"> Min 3 chars</span> }
        </div>
        <div>
          <label>Email:
            <input name="email" type="email" [(ngModel)]="userEmail" required email #e="ngModel" />
          </label>
          @if (e.errors?.['required'] && e.touched) { <span style="color:red"> Required</span> }
          @if (e.errors?.['email'] && e.touched) { <span style="color:red"> Invalid email</span> }
        </div>
        <button type="submit" [disabled]="f.invalid">Submit</button>
      </form>
    </section>
  `,
})
class TemplateValidationComponent {
  username = ''; userEmail = '';
  onSubmit(v: unknown) { console.log('Submit:', v); }
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SimpleFormComponent, LoginFormComponent, SelectAndCheckboxComponent,
            TwoWayBindingComponent, TemplateValidationComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 4.1 — Template-Driven Forms</h1>
      <app-simple-form /><hr />
      <app-login-form /><hr />
      <app-select-checkbox /><hr />
      <app-two-way /><hr />
      <app-template-validation />
    </div>
  `,
})
export class AppComponent {}
