import { Component } from '@angular/core';

// ============================================================
// Exercise 3.5 — Interceptors & Guards
// ============================================================
// Topics:
//   • Functional HTTP interceptors (HttpInterceptorFn)
//   • Functional route guards (CanActivateFn, CanDeactivateFn)
//   • withInterceptors() / provideHttpClient
//   • inject() inside functional interceptors/guards
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: authInterceptor
// ---------------------------------------------------------------------------
// Create a functional HTTP interceptor named `authInterceptor`.
// It should add the header: Authorization: Bearer fake-token-123
// to every outgoing request.
// Use: (req, next) => { const authReq = req.clone({ ... }); return next(authReq); }
//
// export const authInterceptor: HttpInterceptorFn = (req, next) => { ... }

// ---------------------------------------------------------------------------
// TODO 2: loggingInterceptor
// ---------------------------------------------------------------------------
// Create a functional HTTP interceptor named `loggingInterceptor`.
// Log the request URL before sending: console.log('→', req.url)
// Log the response status after receiving: tap(event => ...)
// Use HttpEventType.Response to check for the response event.
//
// export const loggingInterceptor: HttpInterceptorFn = (req, next) => { ... }

// ---------------------------------------------------------------------------
// TODO 3: authGuard
// ---------------------------------------------------------------------------
// Create a functional CanActivateFn named `authGuard`.
// It should check a `isAuthenticated` signal (define it locally as a signal(false)).
// If authenticated, return true; otherwise inject(Router).navigate(['/login']) and return false.
//
// export const authGuard: CanActivateFn = (route, state) => { ... }

// ---------------------------------------------------------------------------
// TODO 4: canDeactivateGuard
// ---------------------------------------------------------------------------
// Create a CanDeactivateFn for a component with a `isDirty: boolean` property.
// If the component is dirty, use window.confirm('Unsaved changes. Leave?') to confirm.
// Return the boolean result.
//
// export interface CanDeactivateComponent { isDirty: boolean; }
// export const canDeactivateGuard: CanDeactivateFn<CanDeactivateComponent> = (component) => { ... }

// ---------------------------------------------------------------------------
// TODO 5: DemoComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-interceptors-demo'.
// Inject HttpClient and make a GET request to https://jsonplaceholder.typicode.com/posts/1.
// Display the result. Note: in this standalone demo the interceptors won't be active
// (they'd be configured in main.ts with withInterceptors). Add a comment explaining this.
//
// @Component({ selector: 'app-interceptors-demo', standalone: true, ... })
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
      <h1>Exercise 3.5 — Interceptors &amp; Guards</h1>
      <!-- TODO: render DemoComponent -->
    </div>
  `,
})
export class AppComponent {}
