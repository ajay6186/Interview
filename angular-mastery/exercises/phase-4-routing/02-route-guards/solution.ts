// Phase 4 - Solution 02: Route Guards
// Topics: CanActivateFn, CanDeactivateFn, CanMatchFn,
//         inject in guards, AuthService with isLoggedIn signal,
//         redirect to /login, unsaved changes guard

import { Component, signal, inject, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ─────────────────────────────────────────────────────────────────────────────
// Simulated Router + guard types for single-file compilation
// In a real app, import from '@angular/router'
// ─────────────────────────────────────────────────────────────────────────────

// Real imports would be:
// import { Router, CanActivateFn, CanDeactivateFn, CanActivateChildFn,
//          ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

type CanActivateFn = (route: unknown, state: unknown) => boolean | string;
type CanDeactivateFn<T> = (component: T, currentRoute: unknown, currentState: unknown, nextState: unknown) => boolean;

// Simulated navigation
const navState = signal<'login' | 'protected' | 'admin'>('login');

// ─────────────────────────────────────────────────────────────────────────────
// 1. AuthService
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AuthService {
  isLoggedIn = signal<boolean>(false);
  currentUser = signal<{ name: string; role: string } | null>(null);

  login(name: string, role: string): void {
    this.currentUser.set({ name, role });
    this.isLoggedIn.set(true);
  }

  logout(): void {
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. authGuard — CanActivateFn
// ─────────────────────────────────────────────────────────────────────────────

/*
// REAL ANGULAR GUARD (functional guard, Angular 14+):
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }
  // createUrlTree preserves query params (e.g. returnUrl) and avoids history pollution
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
*/

// Single-file demo version:
const authGuardFn = (auth: AuthService): boolean => {
  if (auth.isLoggedIn()) return true;
  navState.set('login');
  return false;
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. roleGuard — CanActivateFn + CanActivateChildFn
// ─────────────────────────────────────────────────────────────────────────────

/*
// REAL ANGULAR GUARD:
export const roleGuard: CanActivateFn & CanActivateChildFn = (route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  const requiredRole: string = route.data['role'];
  const user = auth.currentUser();

  if (user && user.role === requiredRole) {
    return true;
  }
  return router.createUrlTree(['/unauthorized']);
};

// Register in routes:
// {
//   path: 'admin',
//   component: AdminComponent,
//   canActivate: [authGuard, roleGuard],
//   canActivateChild: [roleGuard],
//   data: { role: 'admin' },
//   children: [...]
// }
*/

const roleGuardFn = (auth: AuthService, requiredRole: string): boolean => {
  const user = auth.currentUser();
  return user !== null && user.role === requiredRole;
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. unsavedChangesGuard — CanDeactivateFn
// ─────────────────────────────────────────────────────────────────────────────

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/*
// REAL ANGULAR GUARD:
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (
  component,
  currentRoute,
  currentState,
  nextState
) => {
  if (component.hasUnsavedChanges()) {
    return window.confirm(
      'You have unsaved changes. Leave anyway?'
    );
  }
  return true;
};

// Register in routes:
// { path: 'protected', component: ProtectedComponent, canDeactivate: [unsavedChangesGuard] }
*/

// Single-file demo version:
const unsavedChangesGuardFn = (component: HasUnsavedChanges): boolean => {
  if (component.hasUnsavedChanges()) {
    return window.confirm('You have unsaved changes. Leave anyway?');
  }
  return true;
};

// ─────────────────────────────────────────────────────────────────────────────
// 5a. LoginComponent
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div style="padding:1.5rem; background:#e3f2fd; border-radius:8px; margin-bottom:1rem">
      <h2>Login</h2>

      @if (auth.isLoggedIn()) {
        <p>Logged in as <strong>{{ auth.currentUser()?.name }}</strong>
           (role: <em>{{ auth.currentUser()?.role }}</em>)</p>
        <button (click)="logout()" style="background:#e53935; color:white; padding:0.4rem 1rem; border:none; border-radius:4px; cursor:pointer">
          Logout
        </button>
      } @else {
        <div style="display:flex; flex-direction:column; gap:0.75rem; max-width:300px">
          <input [(ngModel)]="name" placeholder="Your name"
                 style="padding:0.4rem; border:1px solid #ccc; border-radius:4px" />
          <select [(ngModel)]="role"
                  style="padding:0.4rem; border:1px solid #ccc; border-radius:4px">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button (click)="login()"
                  style="background:#1a237e; color:white; padding:0.4rem 1rem; border:none; border-radius:4px; cursor:pointer">
            Login
          </button>
        </div>
      }
    </div>
  `,
})
export class LoginComponent {
  auth = inject(AuthService);
  name = '';
  role = 'user';

  login() {
    if (this.name.trim()) {
      this.auth.login(this.name.trim(), this.role);
    }
  }

  logout() {
    this.auth.logout();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5b. ProtectedComponent — implements HasUnsavedChanges
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-protected',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div style="padding:1.5rem; background:#e8f5e9; border-radius:8px; margin-bottom:1rem">
      <h2>Protected Content</h2>
      <p>Only accessible when logged in (guarded by <code>authGuard</code>).</p>

      <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer">
        <input type="checkbox" [(ngModel)]="isDirty" />
        Simulate unsaved changes (triggers <code>canDeactivate</code> guard)
      </label>

      @if (isDirty) {
        <p style="color:#e65100; margin-top:0.5rem">
          Warning: You have unsaved changes! Navigating away will trigger the guard.
        </p>
      }

      <button (click)="tryLeave()"
              style="margin-top:1rem; padding:0.4rem 1rem; background:#7b1fa2; color:white; border:none; border-radius:4px; cursor:pointer">
        Try to navigate away
      </button>
    </div>
  `,
})
export class ProtectedComponent implements HasUnsavedChanges {
  isDirty = false;

  hasUnsavedChanges(): boolean { return this.isDirty; }

  tryLeave() {
    const allowed = unsavedChangesGuardFn(this);
    if (allowed) {
      alert('Navigation allowed — no unsaved changes (or user confirmed).');
      this.isDirty = false;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5c. AdminComponent
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-admin',
  standalone: true,
  template: `
    <div style="padding:1.5rem; background:#fce4ec; border-radius:8px; margin-bottom:1rem">
      <h2>Admin Dashboard</h2>
      <p>Only accessible when logged in with <strong>role: admin</strong>.</p>
      <p style="font-style:italic">(Guarded by <code>authGuard</code> + <code>roleGuard</code>)</p>
    </div>
  `,
})
export class AdminComponent {}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT — wires everything together
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    LoginComponent,
    ProtectedComponent,
    AdminComponent,
  ],
  template: `
    <div style="font-family:sans-serif; max-width:800px; margin:2rem auto; padding:0 1rem">
      <h1>Phase 4 – Route Guards Demo</h1>

      <!-- Login / Logout panel always visible -->
      <app-login />

      <!-- Navigation buttons -->
      <div style="display:flex; gap:1rem; margin-bottom:1rem">
        <button (click)="navigate('protected')"
                style="padding:0.4rem 1rem; background:#1a237e; color:white; border:none; border-radius:4px; cursor:pointer">
          Go to Protected
        </button>
        <button (click)="navigate('admin')"
                style="padding:0.4rem 1rem; background:#4a148c; color:white; border:none; border-radius:4px; cursor:pointer">
          Go to Admin
        </button>
      </div>

      <!-- Guard-controlled views -->
      @switch (currentView()) {
        @case ('protected') {
          @if (canActivate()) {
            <app-protected />
          } @else {
            <div style="padding:1rem; background:#fff3e0; border-radius:8px">
              <strong>Access Denied</strong> — authGuard redirected you to /login
            </div>
          }
        }
        @case ('admin') {
          @if (canActivate() && canActivateAdmin()) {
            <app-admin />
          } @else if (!canActivate()) {
            <div style="padding:1rem; background:#fff3e0; border-radius:8px">
              <strong>Access Denied</strong> — not logged in
            </div>
          } @else {
            <div style="padding:1rem; background:#fce4ec; border-radius:8px">
              <strong>Access Denied</strong> — roleGuard: requires role <em>admin</em>,
              you have <em>{{ auth.currentUser()?.role ?? 'none' }}</em>
            </div>
          }
        }
        @default { <p style="color:#666">Select a route above to test the guards.</p> }
      }

      <!-- Reference card -->
      <div style="margin-top:2rem; padding:1rem; background:#f5f5f5; border-radius:8px; font-size:0.85rem">
        <strong>Route Guard Summary:</strong>
        <ul>
          <li><code>CanActivateFn</code> — runs before the route activates; return true/false/UrlTree</li>
          <li><code>CanActivateChildFn</code> — same, but for all children of a route</li>
          <li><code>CanDeactivateFn&lt;T&gt;</code> — runs before leaving a route; prompt user if dirty</li>
          <li><code>CanMatchFn</code> — prevents even matching the route (useful with lazy routes)</li>
          <li>Use <code>inject()</code> inside functional guards to access services</li>
          <li>Return <code>router.createUrlTree(['/login'])</code> to redirect cleanly</li>
        </ul>
      </div>
    </div>
  `,
})
export class AppComponent {
  auth = inject(AuthService);
  currentView = navState;

  navigate(view: 'protected' | 'admin') {
    navState.set(view);
  }

  canActivate(): boolean {
    return authGuardFn(this.auth);
  }

  canActivateAdmin(): boolean {
    return roleGuardFn(this.auth, 'admin');
  }
}
