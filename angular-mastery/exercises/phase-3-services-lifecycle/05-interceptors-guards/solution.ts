import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient, HttpInterceptorFn, HttpEventType } from '@angular/common/http';
import { CanActivateFn, CanDeactivateFn, Router } from '@angular/router';
import { tap } from 'rxjs';

// ============================================================
// Solution 3.5 — Interceptors & Guards
// ============================================================

// SOLUTION 1: authInterceptor
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authReq = req.clone({
    setHeaders: { Authorization: 'Bearer fake-token-123' },
  });
  return next(authReq);
};

// SOLUTION 2: loggingInterceptor
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('→ Request:', req.url);
  return next(req).pipe(
    tap(event => {
      if (event.type === HttpEventType.Response) {
        console.log('← Response:', req.url, event.status);
      }
    })
  );
};

// SOLUTION 3: authGuard
// isAuthenticated is a module-level signal so it can be shared
export const isAuthenticated = signal(false);

export const authGuard: CanActivateFn = (_route, _state) => {
  if (isAuthenticated()) return true;
  inject(Router).navigate(['/login']);
  return false;
};

// SOLUTION 4: canDeactivateGuard
export interface CanDeactivateComponent { isDirty: boolean; }

export const canDeactivateGuard: CanDeactivateFn<CanDeactivateComponent> = (component) => {
  if (!component.isDirty) return true;
  return window.confirm('You have unsaved changes. Are you sure you want to leave?');
};

// SOLUTION 5: DemoComponent — shows interceptor results
@Component({
  selector: 'app-interceptors-demo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Interceptors Demo</h3>
      <p><em>
        In a real app, authInterceptor and loggingInterceptor would be registered via
        <code>provideHttpClient(withInterceptors([authInterceptor, loggingInterceptor]))</code>
        in main.ts. Open the console to see logging interceptor output.
      </em></p>
      <button (click)="fetchPost()">Fetch Post (check console)</button>
      @if (post()) {
        <div style="margin-top: 8px; padding: 8px; background: #f4f4f4; border-radius: 4px;">
          <strong>{{ post()!.title }}</strong>
          <p>{{ post()!.body }}</p>
        </div>
      }
      <hr style="margin-top: 16px;" />
      <h3>Auth Guard Demo</h3>
      <p>Authenticated: <strong>{{ auth() }}</strong></p>
      <button (click)="toggleAuth()">Toggle Auth State</button>
      <p><em>authGuard would redirect to /login when false.</em></p>
    </section>
  `,
})
class DemoComponent implements OnInit {
  private http = inject(HttpClient);
  post = signal<{ title: string; body: string } | null>(null);
  auth = isAuthenticated;

  ngOnInit() { this.fetchPost(); }

  fetchPost() {
    this.http.get<{ title: string; body: string }>(
      'https://jsonplaceholder.typicode.com/posts/1'
    ).subscribe(p => this.post.set(p));
  }

  toggleAuth() { isAuthenticated.update(v => !v); }
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DemoComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 3.5 — Interceptors &amp; Guards</h1>
      <app-interceptors-demo />
    </div>
  `,
})
export class AppComponent {}
