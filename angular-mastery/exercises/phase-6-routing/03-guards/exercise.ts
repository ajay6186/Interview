import { Component } from '@angular/core';

// ============================================================
// Exercise 6.3 — Route Guards
// ============================================================
// Topics:
//   • CanActivateFn — block access to routes
//   • CanDeactivateFn — warn before leaving
//   • CanMatchFn — match routes conditionally
//   • ResolveFn — prefetch data before navigation
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: authGuard
// ---------------------------------------------------------------------------
// Create a functional CanActivateFn named `authGuard`.
// Check a module-level `isLoggedIn` signal.
// If false, call inject(Router).navigate(['/login']) and return false.
// If true, return true.
//
// export const isLoggedIn = signal(false);
// export const authGuard: CanActivateFn = (route, state) => { ... }

// ---------------------------------------------------------------------------
// TODO 2: roleGuard
// ---------------------------------------------------------------------------
// Create a functional CanActivateFn named `roleGuard`.
// It reads route.data['requiredRole'] (a string).
// Compare against a `currentRole` signal ('admin' | 'user' | 'guest').
// Return true if the user has the required role, otherwise redirect to /unauthorized.
//
// export const currentRole = signal<'admin' | 'user' | 'guest'>('guest');
// export const roleGuard: CanActivateFn = (route, state) => { ... }

// ---------------------------------------------------------------------------
// TODO 3: unsavedChangesGuard
// ---------------------------------------------------------------------------
// Create a CanDeactivateFn named `unsavedChangesGuard`.
// It guards a component that implements `interface HasUnsavedChanges { isDirty: boolean }`.
// If component.isDirty is true, confirm with the user via window.confirm().
// Return true (leave) or false (stay).
//
// export interface HasUnsavedChanges { isDirty: boolean; }
// export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => { ... }

// ---------------------------------------------------------------------------
// TODO 4: dataResolver
// ---------------------------------------------------------------------------
// Create a ResolveFn<User[]> named `usersResolver`.
// It should fetch users from https://jsonplaceholder.typicode.com/users?_limit=3.
// The resolved data will be available in the component via ActivatedRoute.snapshot.data.
//
// export const usersResolver: ResolveFn<User[]> = () => { ... }

// ---------------------------------------------------------------------------
// TODO 5: DemoComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-guards-demo'.
// Show the current login/role state.
// Add buttons to toggle isLoggedIn and change the role.
// Show what routes each guard would allow access to.
//
// @Component({ selector: 'app-guards-demo', standalone: true, ... })
// export class DemoComponent { ... }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO: Add DemoComponent
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 6.3 — Route Guards</h1>
      <!-- TODO: render DemoComponent -->
    </div>
  `,
})
export class AppComponent {}
