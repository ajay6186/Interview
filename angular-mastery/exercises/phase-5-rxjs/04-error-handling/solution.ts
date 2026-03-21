import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { of, throwError, forkJoin, Observable, defer } from 'rxjs';
import { catchError, retry, delay } from 'rxjs/operators';

// ============================================================
// Solution 5.4 — RxJS Error Handling
// ============================================================

const API = 'https://jsonplaceholder.typicode.com';

// SOLUTION 1: catchError with HttpClient
@Component({
  selector: 'app-catch-error',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>catchError</h3>
      <button (click)="fetch()">Fetch Bad URL</button>
      @if (error()) { <p style="color:red">{{ error() }}</p> }
    </section>
  `,
})
class CatchErrorComponent {
  private http = inject(HttpClient);
  error = signal('');

  fetch() {
    this.http.get(`${API}/nonexistent`)
      .pipe(catchError((err: HttpErrorResponse) => {
        this.error.set(`${err.status}: ${err.statusText || 'Unknown error'}`);
        return of(null);
      }))
      .subscribe();
  }
}

// SOLUTION 2: retry
@Component({
  selector: 'app-retry',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>retry(3)</h3>
      <button (click)="run()">Run Flaky Observable</button>
      <p>Attempts: {{ attempts() }}</p>
      <p>{{ status() }}</p>
    </section>
  `,
})
class RetryComponent {
  attempts = signal(0);
  status   = signal('');

  run() {
    this.attempts.set(0);
    this.status.set('Running...');
    let count = 0;
    defer(() => {
      this.attempts.update(n => n + 1);
      count++;
      return count < 3 ? throwError(() => new Error(`Fail attempt ${count}`)) : of('Success!');
    }).pipe(retry(3))
      .subscribe({
        next:  v   => this.status.set(v),
        error: err => this.status.set(`Error: ${err.message}`),
      });
  }
}

// SOLUTION 3: Fallback with catchError + of()
@Component({
  selector: 'app-fallback',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Fallback Data</h3>
      <button (click)="load()">Load (will fail, shows fallback)</button>
      @for (item of items(); track item) { <p>• {{ item }}</p> }
    </section>
  `,
})
class FallbackComponent {
  items = signal<string[]>([]);

  load() {
    throwError(() => new Error('Server down')).pipe(
      catchError(() => of(['Fallback Item 1', 'Fallback Item 2', 'Fallback Item 3'])),
    ).subscribe((data: string[]) => this.items.set(data));
  }
}

// SOLUTION 4: Error boundary with retry button
@Component({
  selector: 'app-error-boundary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Error Boundary + Retry</h3>
      @if (loading()) { <p>Loading...</p> }
      @if (error()) {
        <p style="color:red">{{ error() }}</p>
        <button (click)="load()">Retry</button>
      }
      @if (data()) { <p style="color:green">{{ data() }}</p> }
      @if (!loading() && !error() && !data()) {
        <button (click)="load()">Fetch Data</button>
      }
    </section>
  `,
})
class ErrorBoundaryComponent {
  private http = inject(HttpClient);
  loading = signal(false);
  error   = signal('');
  data    = signal('');

  load() {
    this.loading.set(true); this.error.set(''); this.data.set('');
    this.http.get(`${API}/bad-url`)
      .pipe(
        delay(500),
        catchError((err: HttpErrorResponse) => { this.error.set(`${err.status} — click Retry`); return of(null); }),
      )
      .subscribe(result => {
        this.loading.set(false);
        if (result) this.data.set('Data loaded!');
      });
  }
}

// SOLUTION 5: Partial failure in parallel requests
@Component({
  selector: 'app-partial-failure',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Partial Failure in forkJoin</h3>
      <button (click)="runAll()">Run Parallel (one will fail)</button>
      @for (r of results(); track $index) {
        <p [style.color]="r.error ? 'red' : 'green'">
          {{ r.name }}: {{ r.error ? 'FAILED — ' + r.error : r.data }}
        </p>
      }
    </section>
  `,
})
class PartialFailureComponent {
  results = signal<{ name: string; data?: string; error?: string }[]>([]);

  runAll() {
    const req1 = of('User loaded').pipe(delay(300), catchError(() => of(null)));
    const req2 = throwError(() => new Error('Server error')).pipe(
      delay(200), catchError(e => of({ failed: true, msg: e.message }))
    ) as Observable<{ failed: boolean; msg: string } | null>;
    const req3 = of('Config loaded').pipe(delay(500), catchError(() => of(null)));

    forkJoin([req1, req2, req3]).subscribe(([r1, r2, r3]) => {
      this.results.set([
        { name: 'Request 1', data: r1 as string },
        { name: 'Request 2', error: (r2 as { msg: string })?.msg },
        { name: 'Request 3', data: r3 as string },
      ]);
    });
  }
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CatchErrorComponent, RetryComponent, FallbackComponent,
            ErrorBoundaryComponent, PartialFailureComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 5.4 — Error Handling</h1>
      <app-catch-error /><hr />
      <app-retry /><hr />
      <app-fallback /><hr />
      <app-error-boundary /><hr />
      <app-partial-failure />
    </div>
  `,
})
export class AppComponent {}
