import { Component, Injectable, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Subject, BehaviorSubject, ReplaySubject, AsyncSubject } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// ============================================================
// Solution 5.5 — Subjects
// ============================================================

// SOLUTION 1: Plain Subject as event bus
const eventBus$ = new Subject<string>();
let eventCount = 0;

@Component({ selector: 'app-publisher', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button (click)="emit()">Emit Event {{ n }}</button>`,
})
class PublisherComponent {
  n = 0;
  emit() { this.n++; eventBus$.next(`Event ${++eventCount} at ${new Date().toLocaleTimeString()}`); }
}

@Component({ selector: 'app-listener', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ul>@for (e of events(); track $index) { <li>{{ e }}</li> }</ul>`,
})
class ListenerComponent {
  events = signal<string[]>([]);
  constructor() { eventBus$.pipe(takeUntilDestroyed()).subscribe(e => this.events.update(l => [...l, e])); }
}

@Component({
  selector: 'app-plain-subject',
  standalone: true,
  imports: [PublisherComponent, ListenerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Subject — Event Bus</h3>
      <app-publisher />
      <app-listener />
    </section>
  `,
})
class SubjectComponent {}

// SOLUTION 2: BehaviorSubject for user state
const currentUser$ = new BehaviorSubject<{ name: string } | null>(null);

@Component({
  selector: 'app-behavior-subject',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>BehaviorSubject — User State</h3>
      <p>User: <strong>{{ user()?.name ?? 'Guest' }}</strong></p>
      <button (click)="login()">Login as Alice</button>
      <button (click)="logout()" style="margin-left:8px">Logout</button>
      <p><em>New subscribers immediately get current value.</em></p>
    </section>
  `,
})
class BehaviorSubjectComponent {
  user = toSignal(currentUser$, { initialValue: null });
  login()  { currentUser$.next({ name: 'Alice' }); }
  logout() { currentUser$.next(null); }
}

// SOLUTION 3: ReplaySubject
@Component({
  selector: 'app-replay-subject',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>ReplaySubject(3) — Last 3 Events</h3>
      <button (click)="emit()">Emit Event</button>
      <button (click)="lateSubscribe()" style="margin-left:8px">Late Subscribe</button>
      <p>All events: {{ events().join(', ') }}</p>
      <p>Late subscriber got: {{ lateGot().join(', ') || '(not subscribed yet)' }}</p>
    </section>
  `,
})
class ReplaySubjectComponent {
  replay$ = new ReplaySubject<string>(3);
  events  = signal<string[]>([]);
  lateGot = signal<string[]>([]);
  n = 0;

  constructor() { this.replay$.pipe(takeUntilDestroyed()).subscribe(e => this.events.update(l => [...l, e])); }

  emit() { this.replay$.next(`e${++this.n}`); }
  lateSubscribe() {
    this.lateGot.set([]);
    this.replay$.subscribe(e => this.lateGot.update(l => [...l, e]));
  }
}

// SOLUTION 4: AsyncSubject
@Component({
  selector: 'app-async-subject',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>AsyncSubject — Only Last Value on Complete</h3>
      <button (click)="run()">Run (emits 1,2,3 then completes)</button>
      <p>Result: <strong>{{ result() ?? '(waiting for complete)' }}</strong></p>
      <p><em>Only the last emitted value (3) appears on complete.</em></p>
    </section>
  `,
})
class AsyncSubjectComponent {
  result = signal<number | null>(null);

  run() {
    const subj = new AsyncSubject<number>();
    subj.subscribe(v => this.result.set(v));
    subj.next(1); subj.next(2); subj.next(3);
    subj.complete(); // only now does the subscriber get value 3
  }
}

// SOLUTION 5: Shared state store
interface AppState { count: number; user: string; }

@Injectable({ providedIn: 'root' })
class AppStateService {
  private state$ = new BehaviorSubject<AppState>({ count: 0, user: 'Guest' });
  state = this.state$.asObservable();

  increment()           { this.state$.next({ ...this.state$.value, count: this.state$.value.count + 1 }); }
  setUser(name: string) { this.state$.next({ ...this.state$.value, user: name }); }
}

@Component({ selector: 'app-state-controls', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button (click)="svc.increment()">Increment</button>
    <button (click)="svc.setUser('Alice')" style="margin-left:8px">Set User Alice</button>
    <button (click)="svc.setUser('Bob')" style="margin-left:8px">Set User Bob</button>
  `,
})
class StateControlsComponent { svc = inject(AppStateService); }

@Component({ selector: 'app-state-display', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Count: {{ state()?.count }} | User: {{ state()?.user }}</p>`,
})
class StateDisplayComponent { state = toSignal(inject(AppStateService).state); }

@Component({
  selector: 'app-shared-state',
  standalone: true,
  imports: [StateControlsComponent, StateDisplayComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>BehaviorSubject Store</h3>
      <app-state-controls />
      <app-state-display />
    </section>
  `,
})
class SharedStateComponent {}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SubjectComponent, BehaviorSubjectComponent, ReplaySubjectComponent,
            AsyncSubjectComponent, SharedStateComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 5.5 — Subjects</h1>
      <app-plain-subject /><hr />
      <app-behavior-subject /><hr />
      <app-replay-subject /><hr />
      <app-async-subject /><hr />
      <app-shared-state />
    </div>
  `,
})
export class AppComponent {}
