import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { Subject, from, of, fromEvent } from 'rxjs';
import { map, filter, switchMap, concatMap, mergeMap, exhaustMap,
         debounceTime, delay, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// ============================================================
// Solution 5.2 — Transformation Operators
// ============================================================

// SOLUTION 1: map + filter
@Component({
  selector: 'app-map-filter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>map + filter</h3>
      <p>Input: {{ numbers.join(', ') }}</p>
      <p>map(×2) → filter(>5): <strong>{{ results().join(', ') }}</strong></p>
    </section>
  `,
})
class MapFilterComponent {
  numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  results = signal<number[]>([]);

  constructor() {
    from(this.numbers).pipe(
      map(x => x * 2),
      filter(x => x > 5),
    ).subscribe(v => this.results.update(a => [...a, v]));
  }
}

// SOLUTION 2: switchMap for search
@Component({
  selector: 'app-switch-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>switchMap — Search (cancels previous)</h3>
      <input #searchInput placeholder="Type to search..." (input)="search$.next(searchInput.value)" />
      <p>Result: {{ result() || '...' }}</p>
      <p><em>Try typing quickly — earlier searches are cancelled.</em></p>
    </section>
  `,
})
class SwitchMapComponent {
  search$ = new Subject<string>();
  result  = signal('');

  constructor() {
    this.search$.pipe(
      debounceTime(300),
      switchMap(term => of(`Results for "${term}"`).pipe(delay(500))),
      takeUntilDestroyed(),
    ).subscribe(r => this.result.set(r));
  }
}

// SOLUTION 3: concatMap — sequential queue
@Component({
  selector: 'app-concat-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>concatMap — Sequential Queue</h3>
      <button (click)="click$.next(++clickCount)">Click Me ({{ clickCount }})</button>
      <p>Log: {{ log().join(' → ') }}</p>
      <p><em>Each operation waits for the previous to finish.</em></p>
    </section>
  `,
})
class ConcatMapComponent {
  click$     = new Subject<number>();
  log        = signal<string[]>([]);
  clickCount = 0;

  constructor() {
    this.click$.pipe(
      concatMap(n => of(`Op#${n}`).pipe(delay(1000))),
      takeUntilDestroyed(),
    ).subscribe(r => this.log.update(l => [...l, r]));
  }
}

// SOLUTION 4: mergeMap — concurrent
@Component({
  selector: 'app-merge-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>mergeMap — Concurrent</h3>
      <button (click)="run()">Run 3 Requests</button>
      <p>Completed order: {{ order().join(' → ') }}</p>
      <p><em>Fastest request finishes first (not input order).</em></p>
    </section>
  `,
})
class MergeMapComponent {
  order = signal<string[]>([]);

  run() {
    this.order.set([]);
    const requests = [
      { name: 'Slow (800ms)',   ms: 800 },
      { name: 'Fast (200ms)',   ms: 200 },
      { name: 'Medium (500ms)', ms: 500 },
    ];
    from(requests).pipe(
      mergeMap(r => of(r.name).pipe(delay(r.ms))),
    ).subscribe(name => this.order.update(o => [...o, name]));
  }
}

// SOLUTION 5: exhaustMap — ignore while busy
@Component({
  selector: 'app-exhaust-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>exhaustMap — Prevent Double Submit</h3>
      <button (click)="click$.next(void 0)">Submit (click rapidly!)</button>
      <p>Clicks: {{ clicks() }} | Actual runs: {{ runs() }}</p>
      <p><em>Extra clicks while operation is in-flight are ignored.</em></p>
    </section>
  `,
})
class ExhaustMapComponent {
  click$ = new Subject<void>();
  clicks = signal(0);
  runs   = signal(0);

  constructor() {
    this.click$.pipe(
      tap(() => this.clicks.update(n => n + 1)),
      exhaustMap(() => of('done').pipe(delay(2000))),
      takeUntilDestroyed(),
    ).subscribe(() => this.runs.update(n => n + 1));
  }
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MapFilterComponent, SwitchMapComponent, ConcatMapComponent,
            MergeMapComponent, ExhaustMapComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 5.2 — Transformation Operators</h1>
      <app-map-filter /><hr />
      <app-switch-map /><hr />
      <app-concat-map /><hr />
      <app-merge-map /><hr />
      <app-exhaust-map />
    </div>
  `,
})
export class AppComponent {}
