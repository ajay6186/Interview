import { Component, signal, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal, toObservable } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  interval, Subject, BehaviorSubject, combineLatest, of,
} from 'rxjs';
import {
  map, scan, switchMap, debounceTime, distinctUntilChanged,
  filter, startWith, delay, tap,
} from 'rxjs/operators';

// ============================================================
// Solution 3.2 — RxJS & Observables
// ============================================================

// SOLUTION 1: TimerComponent
@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 2rem; font-weight: bold; min-width: 60px;">
        {{ elapsed$ | async }}s
      </span>
      <button (click)="toggle()"
              style="padding: 6px 14px; cursor: pointer; border-radius: 4px; border: 1px solid #3498db; color: #3498db;">
        {{ running ? 'Pause' : 'Start' }}
      </button>
      <button (click)="reset()"
              style="padding: 6px 14px; cursor: pointer; border-radius: 4px; border: 1px solid #e74c3c; color: #e74c3c;">
        Reset
      </button>
    </div>
  `,
})
class TimerComponent {
  running = false;
  private tick$ = new Subject<void>();
  elapsed$  = this.tick$.pipe(
    scan((acc) => acc + 1, -1),
    map((n) => Math.max(0, n)),
    startWith(0),
  );

  private destroyRef = inject(DestroyRef);
  private sub = interval(1000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
    if (this.running) this.tick$.next();
  });

  toggle() { this.running = !this.running; }
  reset()  { this.running = false; this.elapsed$ = of(0); }
}

// SOLUTION 2: SearchComponent
const mockDb = ['Angular', 'AngularJS', 'React', 'Vue', 'Svelte', 'Solid', 'Qwik', 'Astro', 'Next.js', 'Nuxt'];

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [AsyncPipe, FormsModule],
  template: `
    <input [ngModel]="query" (ngModelChange)="onQuery($event)"
           placeholder="Search frameworks…"
           style="padding: 8px 12px; border-radius: 4px; border: 1px solid #ccc; width: 260px;" />
    @if (loading) {
      <span style="margin-left: 10px; color: gray; font-size: 13px;">Searching…</span>
    }
    <ul style="padding-left: 20px; margin-top: 8px;">
      @for (r of results$ | async; track r) {
        <li>{{ r }}</li>
      } @empty {
        <li style="color: gray; list-style: none;">No results</li>
      }
    </ul>
  `,
})
class SearchComponent {
  query   = '';
  loading = false;
  private search$ = new Subject<string>();

  results$ = this.search$.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    filter((q) => q.length > 1),
    tap(() => (this.loading = true)),
    switchMap((q) =>
      of(mockDb.filter((s) => s.toLowerCase().includes(q.toLowerCase()))).pipe(delay(400))
    ),
    tap(() => (this.loading = false)),
    startWith([] as string[]),
  );

  onQuery(q: string) { this.query = q; this.search$.next(q); }
}

// SOLUTION 3: SubjectDemoComponent
@Component({
  selector: 'app-subject-demo',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    <div style="display: flex; gap: 8px; margin-bottom: 10px;">
      <button (click)="counter$.next(counter$.value - 1)"
              style="padding: 6px 12px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc;">−</button>
      <button (click)="counter$.next(counter$.value + 1)"
              style="padding: 6px 12px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc;">+</button>
      <button (click)="counter$.next(0)"
              style="padding: 6px 12px; cursor: pointer; border-radius: 4px; border: 1px solid #e74c3c; color: #e74c3c;">
        Reset
      </button>
    </div>
    <div style="display: grid; grid-template-columns: repeat(3,1fr); gap: 8px;">
      @for (label of ['Consumer A','Consumer B','Consumer C']; track label) {
        <div style="background: #f0f4ff; padding: 14px; border-radius: 8px; text-align: center;">
          <div style="color: gray; font-size: 12px; margin-bottom: 4px;">{{ label }}</div>
          <div style="font-size: 2rem; font-weight: bold;">{{ counter$ | async }}</div>
        </div>
      }
    </div>
  `,
})
class SubjectDemoComponent {
  counter$ = new BehaviorSubject<number>(0);
}

// SOLUTION 4: CombineLatestComponent
@Component({
  selector: 'app-combine-latest',
  standalone: true,
  imports: [AsyncPipe, FormsModule],
  template: `
    <div style="display: flex; flex-direction: column; gap: 8px; max-width: 320px;">
      <label>A: {{ a }} <input type="range" min="0" max="20" [ngModel]="a" (ngModelChange)="a$.next($event); a = $event" /></label>
      <label>B: {{ b }} <input type="range" min="0" max="20" [ngModel]="b" (ngModelChange)="b$.next($event); b = $event" /></label>
    </div>
    @if (derived$ | async; as d) {
      <div style="display: flex; gap: 16px; margin-top: 10px; font-size: 15px;">
        <span>Sum: <strong>{{ d.sum }}</strong></span>
        <span>Product: <strong>{{ d.product }}</strong></span>
        <span>Max: <strong>{{ d.max }}</strong></span>
      </div>
    }
  `,
})
class CombineLatestComponent {
  a = 5; b = 3;
  a$ = new BehaviorSubject<number>(5);
  b$ = new BehaviorSubject<number>(3);

  derived$ = combineLatest([this.a$, this.b$]).pipe(
    map(([a, b]) => ({ sum: a + b, product: a * b, max: Math.max(a, b) }))
  );
}

// SOLUTION 5: ToSignalComponent
@Component({
  selector: 'app-to-signal',
  standalone: true,
  template: `
    <div style="display: flex; gap: 8px; margin-bottom: 10px;">
      <button (click)="count.update(n => n - 1)"
              style="padding: 6px 12px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc;">−</button>
      <span style="font-size: 1.4rem; font-weight: bold; padding: 0 8px;">{{ count() }}</span>
      <button (click)="count.update(n => n + 1)"
              style="padding: 6px 12px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc;">+</button>
    </div>
    <p style="font-size: 13px; color: gray;">History (toSignal from Observable):</p>
    <div style="font-family: monospace; font-size: 13px;">
      {{ history() | join }}
      <!-- simple display -->
      @for (v of history(); track $index) {
        <span style="margin-right: 4px; background: #f0f0f0; padding: 2px 6px; border-radius: 4px;">{{ v }}</span>
      }
    </div>
  `,
})
class ToSignalComponent {
  count   = signal(0);
  private count$ = toObservable(this.count);
  private history$ = this.count$.pipe(scan((acc: number[], v) => [...acc, v].slice(-10), []));
  history = toSignal(this.history$, { initialValue: [] as number[] });
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    TimerComponent,
    SearchComponent,
    SubjectDemoComponent,
    CombineLatestComponent,
    ToSignalComponent,
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <h1>Solution 3.2 — RxJS &amp; Observables</h1>

      <h2>1. interval + takeUntilDestroyed</h2>
      <app-timer />
      <hr />

      <h2>2. Search (debounce + switchMap)</h2>
      <app-search />
      <hr />

      <h2>3. BehaviorSubject (multiple consumers)</h2>
      <app-subject-demo />
      <hr />

      <h2>4. combineLatest</h2>
      <app-combine-latest />
      <hr />

      <h2>5. toSignal / toObservable</h2>
      <app-to-signal />
    </div>
  `,
})
export class AppComponent {}
