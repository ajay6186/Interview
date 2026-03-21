import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Subject, combineLatest, forkJoin, merge, zip, of } from 'rxjs';
import { delay, withLatestFrom, map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// ============================================================
// Solution 5.3 — Combination Operators
// ============================================================

// SOLUTION 1: combineLatest
@Component({
  selector: 'app-combine-latest',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>combineLatest</h3>
      <label>Slider 1: <input type="range" [ngModel]="s1" (ngModelChange)="slider1$.next($event)" /></label> {{ s1 }}<br />
      <label>Slider 2: <input type="range" [ngModel]="s2" (ngModelChange)="slider2$.next($event)" /></label> {{ s2 }}<br />
      <p>Sum: <strong>{{ combined().join(' + ') }} = {{ combined()[0] + combined()[1] }}</strong></p>
    </section>
  `,
})
class CombineLatestComponent {
  slider1$ = new BehaviorSubject<number>(50);
  slider2$ = new BehaviorSubject<number>(50);
  combined = signal<[number, number]>([50, 50]);
  s1 = 50; s2 = 50;

  constructor() {
    combineLatest([this.slider1$, this.slider2$])
      .pipe(takeUntilDestroyed())
      .subscribe(([a, b]) => { this.combined.set([a, b]); this.s1 = a; this.s2 = b; });
  }
}

// SOLUTION 2: forkJoin
@Component({
  selector: 'app-fork-join',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>forkJoin — Parallel Requests</h3>
      <button (click)="runAll()">Run 3 Parallel Requests</button>
      @if (loading()) { <p>Loading all requests...</p> }
      @if (results()) {
        <ul>
          @for (r of results()!; track r) { <li>{{ r }}</li> }
        </ul>
      }
    </section>
  `,
})
class ForkJoinComponent {
  loading = signal(false);
  results = signal<string[] | null>(null);

  runAll() {
    this.loading.set(true);
    this.results.set(null);
    forkJoin([
      of('User data').pipe(delay(800)),
      of('Posts data').pipe(delay(400)),
      of('Config data').pipe(delay(600)),
    ]).subscribe(([u, p, c]) => {
      this.loading.set(false);
      this.results.set([u, p, c]);
    });
  }
}

// SOLUTION 3: merge
@Component({
  selector: 'app-merge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>merge — Two Event Streams</h3>
      <button (click)="stream1$.next('Stream A')">Emit Stream A</button>
      <button (click)="stream2$.next('Stream B')" style="margin-left:8px">Emit Stream B</button>
      <ul>
        @for (e of log(); track $index) { <li>{{ e }}</li> }
      </ul>
    </section>
  `,
})
class MergeComponent {
  stream1$ = new Subject<string>();
  stream2$ = new Subject<string>();
  log = signal<string[]>([]);

  constructor() {
    merge(this.stream1$, this.stream2$)
      .pipe(takeUntilDestroyed())
      .subscribe(v => this.log.update(l => [...l, v]));
  }
}

// SOLUTION 4: zip
@Component({
  selector: 'app-zip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>zip — Pair Items</h3>
      @for (pair of pairs(); track $index) {
        <p>{{ pair[0] }}: {{ pair[1] }}</p>
      }
    </section>
  `,
})
class ZipComponent {
  pairs = signal<[string, number][]>([]);

  constructor() {
    zip(
      of('Alice', 'Bob', 'Carol'),
      of(95, 87, 72),
    ).subscribe(pair => this.pairs.update(p => [...p, pair as [string, number]]));
  }
}

// SOLUTION 5: withLatestFrom
@Component({
  selector: 'app-with-latest-from',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>withLatestFrom</h3>
      <label>Username: <input [(ngModel)]="username" (ngModelChange)="username$.next($event)" /></label><br /><br />
      <button (click)="click$.next(void 0)">Click Action</button>
      <ul>
        @for (entry of log(); track $index) { <li>{{ entry }}</li> }
      </ul>
    </section>
  `,
})
class WithLatestFromComponent {
  username  = 'Alice';
  username$ = new BehaviorSubject<string>('Alice');
  click$    = new Subject<void>();
  log       = signal<string[]>([]);

  constructor() {
    this.click$.pipe(
      withLatestFrom(this.username$),
      map(([, user]) => `${user} clicked at ${new Date().toLocaleTimeString()}`),
      takeUntilDestroyed(),
    ).subscribe(entry => this.log.update(l => [...l, entry]));
  }
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CombineLatestComponent, ForkJoinComponent, MergeComponent,
            ZipComponent, WithLatestFromComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 5.3 — Combination Operators</h1>
      <app-combine-latest /><hr />
      <app-fork-join /><hr />
      <app-merge /><hr />
      <app-zip /><hr />
      <app-with-latest-from />
    </div>
  `,
})
export class AppComponent {}
