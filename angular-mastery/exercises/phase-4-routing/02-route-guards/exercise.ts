// Phase 4 - Exercise 02: Route Guards
// Topics: CanActivateFn, CanDeactivateFn, CanMatchFn,
//         inject in guards, AuthService with isLoggedIn signal,
//         redirect to /login, unsaved changes guard
//
// Docs: https://angular.dev/guide/routing/route-guards

import { Component } from '@angular/core';

// ─────────────────────────────────────────────
// TODO 1: Create AuthService
//
// - Use @Injectable({ providedIn: 'root' })
// - Add: isLoggedIn = signal<boolean>(false)
// - Add: currentUser = signal<{ name: string; role: string } | null>(null)
// - Add: login(name: string, role: string): void  → sets both signals
// - Add: logout(): void                           → resets both signals
// ─────────────────────────────────────────────

// TODO 1: AuthService
// @Injectable({ providedIn: 'root' })
// export class AuthService { ... }

// ─────────────────────────────────────────────
// TODO 2: authGuard — CanActivateFn
//
// - Export const authGuard: CanActivateFn = (route, state) => { ... }
// - inject(AuthService) inside the guard
// - If isLoggedIn() is true, return true
// - Otherwise inject(Router).createUrlTree(['/login']) and return it
//   (redirects without changing browser history)
// ─────────────────────────────────────────────

// TODO 2: authGuard
// export const authGuard: CanActivateFn = (route, state) => { ... }

// ─────────────────────────────────────────────
// TODO 3: roleGuard — CanActivateFn + CanActivateChildFn
//
// - Routes pass required role via route.data['role']
// - inject(AuthService) and check currentUser()?.role === route.data['role']
// - If user has role, return true; otherwise navigate to '/unauthorized'
// - Also implement CanActivateChildFn so it protects all child routes too
// ─────────────────────────────────────────────

// TODO 3: roleGuard
// export const roleGuard: CanActivateFn & CanActivateChildFn = (route, state) => { ... }

// ─────────────────────────────────────────────
// TODO 4: unsavedChangesGuard — CanDeactivateFn
//
// - Define interface HasUnsavedChanges { hasUnsavedChanges(): boolean; }
// - Export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges>
// - If component.hasUnsavedChanges() is true, show window.confirm(...)
//   and return true/false based on user choice
// - Otherwise return true (allow navigation)
// ─────────────────────────────────────────────

// TODO 4: unsavedChangesGuard interface + guard
// export interface HasUnsavedChanges { hasUnsavedChanges(): boolean; }
// export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = ...

// ─────────────────────────────────────────────
// TODO 5: Create LoginComponent, AdminComponent, ProtectedComponent
//
// LoginComponent:
// - Form with name input and role select (admin | user)
// - On submit: inject(AuthService).login(name, role), then navigate to '/'
// - If already logged in, show "Logged in as X" + logout button
//
// ProtectedComponent:
// - Displays "Protected Content – only for logged-in users"
// - Implements HasUnsavedChanges (add a "dirty form" toggle for demo)
//
// AdminComponent:
// - Displays "Admin Dashboard – only for role: admin"
// ─────────────────────────────────────────────

// TODO 5a: LoginComponent
// @Component({ ... })
// export class LoginComponent { }

// TODO 5b: ProtectedComponent (implements HasUnsavedChanges)
// @Component({ ... })
// export class ProtectedComponent implements HasUnsavedChanges { }

// TODO 5c: AdminComponent
// @Component({ ... })
// export class AdminComponent { }

// ─────────────────────────────────────────────
// TODO 6: Add all components to imports[] and render them in AppComponent
//
// Route config reference (register in main.ts with provideRouter):
//
// export const routes: Routes = [
//   { path: 'login',     component: LoginComponent },
//   { path: 'protected', component: ProtectedComponent, canActivate: [authGuard], canDeactivate: [unsavedChangesGuard] },
//   { path: 'admin',     component: AdminComponent,     canActivate: [authGuard, roleGuard], data: { role: 'admin' } },
//   { path: '**', redirectTo: 'login' },
// ];
// ─────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO 6: import components here
  ],
  template: `
    <h1>Route Guards Exercise</h1>
    <!-- TODO 6: render LoginComponent, ProtectedComponent, AdminComponent -->
  `,
})
export class AppComponent {}
