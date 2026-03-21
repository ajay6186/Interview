import { Component, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { of, from, interval, timer, BehaviorSubject, Observable, delay } from 'rxjs';
import { take, map, scan } from 'rxjs/operators';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

// ============================================================
// Solution 5.1 — Observables
// ============================================================

// SOLUTION 1: Observable creation operators
@Component({
  selector: 'app-observable-creation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Observable Creation</h3>
      <p>of(1,2,3): {{ ofValues().join(', ') }}</p>
      <p>from(['a','b','c']): {{ fromValues().join(', ') }}</p>
      <p>interval tick: {{ tick() }}</p>
      <p>timer countdown: {{ countdown() }}</p>
    </section>
  `,
})
class ObservableCreationComponent {
  ofValues   = signal<number[]>([]);
  fromValues = signal<string[]>([]);
  tick       = signal(0);
  countdown  = signal(5);

  constructor() {
    of(1, 2, 3).subscribe(v => this.ofValues.update(a => [...a, v]));
    from(['a', 'b', 'c']).subscribe(v => this.fromValues.update(a => [...a, v]));
    interval(500).pipe(take(5), takeUntilDestroyed()).subscribe(n => this.tick.set(n));
    timer(0, 1000).pipe(take(6), map(n => 5 - n), takeUntilDestroyed())
      .subscribe(n => this.countdown.set(n));
  }
}

// SOLUTION 2: Subscription with cleanup
@Component({
  selector: 'app-subscription',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Subscription + takeUntilDestroyed</h3>
      <p>Current tick: {{ current() }}</p>
      <p>Last 5: {{ log().join(', ') }}</p>
    </section>
  `,
})
class SubscriptionComponent {
  current = signal(0);
  log     = signal<number[]>([]);

  constructor() {
    interval(1000).pipe(takeUntilDestroyed()).subscribe(n => {
      this.current.set(n);
      this.log.update(l => [...l.slice(-4), n]);
    });
  }
}

// SOLUTION 3: BehaviorSubject shared state
const sharedCount$ = new BehaviorSubject<number>(0);

@Component({
  selector: 'app-sender',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <strong>Sender:</strong>
      <button (click)="sharedCount$.next(sharedCount$.value - 1)">−</button>
      <button (click)="sharedCount$.next(sharedCount$.value + 1)" style="margin-left:4px">+</button>
    </div>
  `,
})
class SenderComponent { sharedCount$ = sharedCount$; }

@Component({
  selector: 'app-receiver',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div><strong>Receiver:</strong> {{ value() }}</div>`,
})
class ReceiverComponent {
  value = toSignal(sharedCount$, { initialValue: 0 });
}

@Component({
  selector: 'app-subject',
  standalone: true,
  imports: [SenderComponent, ReceiverComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>BehaviorSubject Shared State</h3>
      <app-sender />
      <app-receiver />
    </section>
  `,
})
class SubjectComponent {}

// SOLUTION 4: toSignal
@Component({
  selector: 'app-to-signal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>toSignal()</h3>
      <p>interval tick: {{ tick() }}</p>
      <p>Names: {{ names() }}</p>
    </section>
  `,
})
class ToSignalComponent {
  tick  = toSignal(interval(1000), { initialValue: 0 });
  names = toSignal(of(['Alice', 'Bob', 'Carol']), { initialValue: [] as string[] });
}

// SOLUTION 5: async pipe
@Component({
  selector: 'app-async-pipe',
  standalone: true,
  imports: [AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>async Pipe</h3>
      @if (names$ | async; as names) {
        <ul>
          @for (name of names; track name) { <li>{{ name }}</li> }
        </ul>
      } @else {
        <p>Loading...</p>
      }
    </section>
  `,
})
class AsyncPipeComponent {
  names$: Observable<string[]> = of(['Alice', 'Bob', 'Carol']).pipe(delay(1500));
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ObservableCreationComponent, SubscriptionComponent, SubjectComponent,
            ToSignalComponent, AsyncPipeComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 5.1 — Observables</h1>
      <app-observable-creation /><hr />
      <app-subscription /><hr />
      <app-subject /><hr />
      <app-to-signal /><hr />
      <app-async-pipe />
    </div>
  `,
})
export class AppComponent {}
