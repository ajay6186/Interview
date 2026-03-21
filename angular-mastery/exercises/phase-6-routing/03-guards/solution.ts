import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CanActivateFn, CanDeactivateFn, ResolveFn, Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

// ============================================================
// Solution 6.3 — Route Guards
// ============================================================

// SOLUTION 1: authGuard
export const isLoggedIn = signal(false);

export const authGuard: CanActivateFn = (_route, _state) => {
  if (isLoggedIn()) return true;
  inject(Router).navigate(['/login']);
  return false;
};

// SOLUTION 2: roleGuard
export const currentRole = signal<'admin' | 'user' | 'guest'>('guest');

export const roleGuard: CanActivateFn = (route, _state) => {
  const required = route.data['requiredRole'] as string;
  const role = currentRole();
  if (role === required || (required === 'user' && role === 'admin')) return true;
  inject(Router).navigate(['/unauthorized']);
  return false;
};

// SOLUTION 3: unsavedChangesGuard
export interface HasUnsavedChanges { isDirty: boolean; }

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (!component.isDirty) return true;
  return window.confirm('You have unsaved changes. Are you sure you want to leave?');
};

// SOLUTION 4: dataResolver
interface User { id: number; name: string; email: string; }

export const usersResolver: ResolveFn<User[]> = () =>
  inject(HttpClient).get<User[]>('https://jsonplaceholder.typicode.com/users?_limit=3');

// SOLUTION 5: Demo component
@Component({
  selector: 'app-guards-demo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Guard State Demo</h3>
      <p>Logged In: <strong [style.color]="loggedIn() ? 'green' : 'red'">{{ loggedIn() }}</strong></p>
      <p>Role: <strong>{{ role() }}</strong></p>
      <button (click)="loggedIn.update(v => !v)">Toggle Login</button>
      <button (click)="cycleRole()" style="margin-left:8px">Cycle Role</button>

      <h4>Guard Results:</h4>
      <p>authGuard → <strong [style.color]="loggedIn() ? 'green' : 'red'">{{ loggedIn() ? 'ALLOW' : 'REDIRECT /login' }}</strong></p>
      <p>roleGuard (requires admin) → <strong [style.color]="role() === 'admin' ? 'green' : 'red'">
        {{ role() === 'admin' ? 'ALLOW' : 'REDIRECT /unauthorized' }}
      </strong></p>
      <p>unsavedChangesGuard → depends on component.isDirty at runtime</p>
    </section>
  `,
})
class GuardsDemoComponent {
  loggedIn = isLoggedIn;
  role     = currentRole;
  private roles: ('admin' | 'user' | 'guest')[] = ['guest', 'user', 'admin'];
  private idx = 0;
  cycleRole() { this.idx = (this.idx + 1) % this.roles.length; currentRole.set(this.roles[this.idx]); }
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GuardsDemoComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 6.3 — Route Guards</h1>
      <app-guards-demo />
    </div>
  `,
})
export class AppComponent {}
