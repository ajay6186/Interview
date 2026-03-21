import {
  Component,
  OnInit,
  Input,
  signal,
  inject,
  DestroyRef,
} from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  Observable,
  of,
  from,
  interval,
  timer,
  EMPTY,
  NEVER,
  throwError,
  range,
  generate,
  defer,
  iif,
  Subject,
  BehaviorSubject,
  fromEvent,
  ConnectableObservable,
  merge,
} from 'rxjs';
import {
  map,
  take,
  tap,
  catchError,
  filter,
  throttleTime,
  publish,
  refCount,
  multicast,
  retry,
  scan,
} from 'rxjs/operators';

// ─────────────────────────────────────────────
// Ex01 — of() display values
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-01',
  standalone: true,
  template: `<div><strong>Ex01 of():</strong> {{ values() | json }}</div>`,
  imports: [CommonModule],
})
export class Ex01 {
  values = signal<number[]>([]);
  constructor() {
    const collected: number[] = [];
    of(10, 20, 30, 40, 50).subscribe((v) => {
      collected.push(v);
      this.values.set([...collected]);
    });
  }
}

// ─────────────────────────────────────────────
// Ex02 — from() array
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-02',
  standalone: true,
  template: `<div><strong>Ex02 from([]):</strong> {{ items() | json }}</div>`,
  imports: [CommonModule],
})
export class Ex02 {
  items = signal<string[]>([]);
  constructor() {
    const acc: string[] = [];
    from(['alpha', 'beta', 'gamma', 'delta']).subscribe((v) => {
      acc.push(v);
      this.items.set([...acc]);
    });
  }
}

// ─────────────────────────────────────────────
// Ex03 — from() Promise
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-03',
  standalone: true,
  template: `<div><strong>Ex03 from(Promise):</strong> {{ result() }}</div>`,
})
export class Ex03 {
  result = signal<string>('pending…');
  constructor() {
    from(Promise.resolve('Promise resolved!')).subscribe((v) =>
      this.result.set(v)
    );
  }
}

// ─────────────────────────────────────────────
// Ex04 — interval() with async pipe
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-04',
  standalone: true,
  imports: [AsyncPipe],
  template: `<div><strong>Ex04 interval() async pipe:</strong> tick {{ tick$ | async }}</div>`,
})
export class Ex04 {
  tick$ = interval(1000).pipe(take(100));
}

// ─────────────────────────────────────────────
// Ex05 — timer() single fire
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-05',
  standalone: true,
  template: `<div><strong>Ex05 timer(2000) single fire:</strong> {{ fired() }}</div>`,
})
export class Ex05 {
  fired = signal('waiting…');
  constructor() {
    timer(2000).subscribe(() => this.fired.set('Fired after 2s!'));
  }
}

// ─────────────────────────────────────────────
// Ex06 — timer(delay, interval)
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-06',
  standalone: true,
  template: `<div><strong>Ex06 timer(1000, 500):</strong> tick {{ tick() }}</div>`,
})
export class Ex06 {
  tick = signal(0);
  private destroyRef = inject(DestroyRef);
  constructor() {
    timer(1000, 500)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => this.tick.set(v));
  }
}

// ─────────────────────────────────────────────
// Ex07 — EMPTY observable
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-07',
  standalone: true,
  template: `<div><strong>Ex07 EMPTY:</strong> {{ status() }}</div>`,
})
export class Ex07 {
  status = signal('subscribed, waiting…');
  constructor() {
    EMPTY.subscribe({
      complete: () => this.status.set('Completed immediately (no values)'),
    });
  }
}

// ─────────────────────────────────────────────
// Ex08 — NEVER observable
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-08',
  standalone: true,
  template: `<div><strong>Ex08 NEVER:</strong> {{ status() }}</div>`,
})
export class Ex08 {
  status = signal('subscribed — NEVER emits, never completes');
  constructor() {
    const sub = NEVER.subscribe();
    // just to show subscription exists
    this.status.set(`NEVER: subscription active (isUnsubscribed: ${sub.closed})`);
  }
}

// ─────────────────────────────────────────────
// Ex09 — throwError()
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-09',
  standalone: true,
  template: `<div><strong>Ex09 throwError():</strong> {{ msg() }}</div>`,
})
export class Ex09 {
  msg = signal('');
  constructor() {
    throwError(() => new Error('Something went wrong!'))
      .pipe(catchError((e: Error) => of(`Caught: ${e.message}`)))
      .subscribe((v) => this.msg.set(v));
  }
}

// ─────────────────────────────────────────────
// Ex10 — range(1, 10)
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-10',
  standalone: true,
  template: `<div><strong>Ex10 range(1,10):</strong> {{ nums() | json }}</div>`,
  imports: [CommonModule],
})
export class Ex10 {
  nums = signal<number[]>([]);
  constructor() {
    const acc: number[] = [];
    range(1, 10).subscribe((v) => {
      acc.push(v);
      this.nums.set([...acc]);
    });
  }
}

// ─────────────────────────────────────────────
// Ex11 — generate()
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-11',
  standalone: true,
  template: `<div><strong>Ex11 generate():</strong> {{ vals() | json }}</div>`,
  imports: [CommonModule],
})
export class Ex11 {
  vals = signal<number[]>([]);
  constructor() {
    const acc: number[] = [];
    generate(
      0,
      (x) => x < 10,
      (x) => x + 2
    ).subscribe((v) => {
      acc.push(v);
      this.vals.set([...acc]);
    });
  }
}

// ─────────────────────────────────────────────
// Ex12 — defer()
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-12',
  standalone: true,
  template: `<div><strong>Ex12 defer():</strong> {{ time() }}</div>`,
})
export class Ex12 {
  time = signal('');
  constructor() {
    const deferred$ = defer(() => of(new Date().toLocaleTimeString()));
    deferred$.subscribe((v) => this.time.set(`Deferred created at: ${v}`));
  }
}

// ─────────────────────────────────────────────
// Ex13 — iif()
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-13',
  standalone: true,
  template: `
    <div>
      <strong>Ex13 iif():</strong> {{ result() }}
      <button (click)="toggle()">Toggle ({{ condition() }})</button>
    </div>`,
})
export class Ex13 {
  condition = signal(true);
  result = signal('');
  toggle() {
    this.condition.update((v) => !v);
    iif(
      () => this.condition(),
      of('Condition TRUE → stream A'),
      of('Condition FALSE → stream B')
    ).subscribe((v) => this.result.set(v));
  }
  constructor() {
    this.toggle();
  }
}

// ─────────────────────────────────────────────
// Ex14 — subscribe with observer object
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-14',
  standalone: true,
  template: `<div><strong>Ex14 observer object:</strong> {{ log() }}</div>`,
})
export class Ex14 {
  log = signal('');
  constructor() {
    of(1, 2, 3).subscribe({
      next: (v) => this.log.set(`last next: ${v}`),
      error: (e) => this.log.set(`error: ${e}`),
      complete: () => this.log.update((l) => l + ' | completed'),
    });
  }
}

// ─────────────────────────────────────────────
// Ex15 — subscribe next/error/complete
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-15',
  standalone: true,
  template: `<div><strong>Ex15 next/error/complete:</strong> {{ status() }}</div>`,
})
export class Ex15 {
  status = signal('');
  constructor() {
    const msgs: string[] = [];
    of('a', 'b', 'c').subscribe(
      (v) => msgs.push(`next:${v}`),
      (e) => msgs.push(`err:${e}`),
      () => {
        msgs.push('complete');
        this.status.set(msgs.join(', '));
      }
    );
  }
}

// ─────────────────────────────────────────────
// Ex16 — takeUntilDestroyed pattern
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-16',
  standalone: true,
  template: `<div><strong>Ex16 takeUntilDestroyed:</strong> tick {{ tick() }}</div>`,
})
export class Ex16 {
  tick = signal(0);
  private destroyRef = inject(DestroyRef);
  constructor() {
    interval(800)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => this.tick.set(v));
  }
}

// ─────────────────────────────────────────────
// Ex17 — take(3) limited subscription
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-17',
  standalone: true,
  template: `<div><strong>Ex17 take(3):</strong> {{ vals() | json }}</div>`,
  imports: [CommonModule],
})
export class Ex17 {
  vals = signal<number[]>([]);
  constructor() {
    const acc: number[] = [];
    interval(300)
      .pipe(take(3))
      .subscribe({
        next: (v) => {
          acc.push(v);
          this.vals.set([...acc]);
        },
      });
  }
}

// ─────────────────────────────────────────────
// Ex18 — toSignal() from Observable
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-18',
  standalone: true,
  template: `<div><strong>Ex18 toSignal():</strong> {{ counter() }}</div>`,
})
export class Ex18 {
  counter = toSignal(interval(1000), { initialValue: 0 });
}

// ─────────────────────────────────────────────
// Ex19 — toSignal() with initialValue
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-19',
  standalone: true,
  template: `<div><strong>Ex19 toSignal initialValue:</strong> {{ word() }}</div>`,
})
export class Ex19 {
  word = toSignal(
    timer(1500).pipe(map(() => 'Loaded after 1.5s!')),
    { initialValue: 'Loading…' }
  );
}

// ─────────────────────────────────────────────
// Ex20 — async pipe with observable
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-20',
  standalone: true,
  imports: [AsyncPipe],
  template: `<div><strong>Ex20 async pipe:</strong> {{ data$ | async }}</div>`,
})
export class Ex20 {
  data$ = timer(1000).pipe(map(() => 'Data arrived via async pipe!'));
}

// ─────────────────────────────────────────────
// Ex21 — BehaviorSubject.asObservable()
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-21',
  standalone: true,
  template: `<div><strong>Ex21 BehaviorSubject.asObservable():</strong> {{ val() }}</div>`,
})
export class Ex21 {
  private bs = new BehaviorSubject<number>(0);
  val = toSignal(this.bs.asObservable(), { initialValue: 0 });
  constructor() {
    setTimeout(() => this.bs.next(42), 800);
  }
}

// ─────────────────────────────────────────────
// Ex22 — Subject emit and listen
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-22',
  standalone: true,
  template: `
    <div>
      <strong>Ex22 Subject:</strong> {{ last() }}
      <button (click)="emit()">Emit</button>
    </div>`,
})
export class Ex22 {
  private subject = new Subject<string>();
  last = signal('(nothing yet)');
  private destroyRef = inject(DestroyRef);
  constructor() {
    this.subject
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => this.last.set(v));
  }
  emit() {
    this.subject.next(`Event at ${new Date().toLocaleTimeString()}`);
  }
}

// ─────────────────────────────────────────────
// Ex23 — fromEvent on button click
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-23',
  standalone: true,
  template: `
    <div>
      <strong>Ex23 fromEvent click:</strong> {{ clicks() }} clicks
      <button #btn>Click me</button>
    </div>`,
})
export class Ex23 implements OnInit {
  clicks = signal(0);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    const btn = document.querySelector('ex-23 button');
    if (btn) {
      fromEvent(btn, 'click')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.clicks.update((n) => n + 1));
    }
  }
}

// ─────────────────────────────────────────────
// Ex24 — fromEvent keyboard
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-24',
  standalone: true,
  template: `
    <div>
      <strong>Ex24 fromEvent keyup:</strong> last key = {{ key() }}
      <input placeholder="type here" />
    </div>`,
})
export class Ex24 implements OnInit {
  key = signal('—');
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    const input = document.querySelector('ex-24 input');
    if (input) {
      fromEvent<KeyboardEvent>(input, 'keyup')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((e) => this.key.set(e.key));
    }
  }
}

// ─────────────────────────────────────────────
// Ex25 — fromEvent scroll throttle
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-25',
  standalone: true,
  template: `
    <div>
      <strong>Ex25 fromEvent scroll throttle:</strong> scrollY = {{ scrollY() }}
      <div style="height:80px;overflow-y:scroll;border:1px solid #ccc">
        <div style="height:400px">Scroll inside here</div>
      </div>
    </div>`,
})
export class Ex25 implements OnInit {
  scrollY = signal(0);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    const el = document.querySelector('ex-25 div div[style*="height:80px"]');
    if (el) {
      fromEvent(el, 'scroll')
        .pipe(throttleTime(200), takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.scrollY.set((el as HTMLElement).scrollTop));
    }
  }
}

// ─────────────────────────────────────────────
// Ex26 — webSocket concept demo
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-26',
  standalone: true,
  template: `<div><strong>Ex26 WebSocket concept:</strong> {{ msg() }}</div>`,
})
export class Ex26 {
  msg = signal('WebSocket messages would appear here via webSocket<T>() from rxjs/webSocket');
}

// ─────────────────────────────────────────────
// Ex27 — Parent creating Observable, child subscribing via @Input
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-27-child',
  standalone: true,
  template: `<span>child val: {{ val() }}</span>`,
})
export class Ex27Child implements OnInit {
  @Input() source$!: Observable<number>;
  val = signal(0);
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    this.source$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => this.val.set(v));
  }
}
@Component({
  selector: 'ex-27',
  standalone: true,
  imports: [Ex27Child],
  template: `<div><strong>Ex27 @Input Observable:</strong> <ex-27-child [source$]="obs$" /></div>`,
})
export class Ex27 {
  obs$ = interval(700).pipe(take(20));
}

// ─────────────────────────────────────────────
// Ex28 — Observable chain in template
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-28',
  standalone: true,
  imports: [AsyncPipe],
  template: `<div><strong>Ex28 Observable chain async pipe:</strong> {{ chain$ | async }}</div>`,
})
export class Ex28 {
  chain$ = interval(600).pipe(
    take(10),
    map((v) => v * 3),
    scan((acc, v) => acc + v, 0),
    map((v) => `Running sum: ${v}`)
  );
}

// ─────────────────────────────────────────────
// Ex29 — Observable with multiple subscribers
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-29',
  standalone: true,
  template: `
    <div>
      <strong>Ex29 multiple subscribers:</strong>
      Sub A: {{ a() }} | Sub B: {{ b() }}
    </div>`,
})
export class Ex29 {
  private destroyRef = inject(DestroyRef);
  a = signal(0);
  b = signal(0);
  constructor() {
    const src$ = interval(500).pipe(takeUntilDestroyed(this.destroyRef));
    src$.subscribe((v) => this.a.set(v));
    src$.subscribe((v) => this.b.set(v * 2));
  }
}

// ─────────────────────────────────────────────
// Ex30 — Observable passed as @Input
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-30-child',
  standalone: true,
  imports: [AsyncPipe],
  template: `<span>{{ data$ | async }}</span>`,
})
export class Ex30Child {
  @Input() data$!: Observable<string>;
}
@Component({
  selector: 'ex-30',
  standalone: true,
  imports: [Ex30Child],
  template: `<div><strong>Ex30 Observable @Input async pipe:</strong> <ex-30-child [data$]="src$" /></div>`,
})
export class Ex30 {
  src$ = timer(500, 1000).pipe(map((v) => `Tick ${v}`), take(5));
}

// ─────────────────────────────────────────────
// Ex31 — Observable from service (simulated)
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-31',
  standalone: true,
  template: `<div><strong>Ex31 Observable from service:</strong> {{ data() }}</div>`,
})
export class Ex31 {
  data = signal('loading…');
  constructor() {
    // Simulating a service call
    const service$ = timer(600).pipe(map(() => 'Data from service!'));
    service$.subscribe((v) => this.data.set(v));
  }
}

// ─────────────────────────────────────────────
// Ex32 — Multiple Observable subscriptions in one component
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-32',
  standalone: true,
  template: `
    <div>
      <strong>Ex32 multiple subs:</strong>
      A={{ a() }}, B={{ b() }}, C={{ c() }}
    </div>`,
})
export class Ex32 {
  private destroyRef = inject(DestroyRef);
  a = signal(0);
  b = signal(0);
  c = signal(0);
  constructor() {
    interval(400).pipe(take(10), takeUntilDestroyed(this.destroyRef)).subscribe((v) => this.a.set(v));
    interval(700).pipe(take(10), takeUntilDestroyed(this.destroyRef)).subscribe((v) => this.b.set(v));
    interval(1100).pipe(take(10), takeUntilDestroyed(this.destroyRef)).subscribe((v) => this.c.set(v));
  }
}

// ─────────────────────────────────────────────
// Ex33 — Observable + signal combo
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-33',
  standalone: true,
  template: `
    <div>
      <strong>Ex33 Observable + signal:</strong>
      obs={{ obsVal() }}, manual={{ manualVal() }}
    </div>`,
})
export class Ex33 {
  obsVal = toSignal(interval(900).pipe(take(20)), { initialValue: 0 });
  manualVal = signal(100);
  constructor() {
    setTimeout(() => this.manualVal.set(999), 2000);
  }
}

// ─────────────────────────────────────────────
// Ex34 — Observable-driven animation (CSS class toggle)
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-34',
  standalone: true,
  template: `
    <div>
      <strong>Ex34 Observable animation:</strong>
      <span [style.color]="frame() % 2 === 0 ? 'blue' : 'orange'">■ pulsing</span>
    </div>`,
})
export class Ex34 {
  frame = toSignal(interval(500), { initialValue: 0 });
}

// ─────────────────────────────────────────────
// Ex35 — Error in observable chain displayed
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-35',
  standalone: true,
  template: `<div><strong>Ex35 error displayed:</strong> {{ msg() }}</div>`,
})
export class Ex35 {
  msg = signal('');
  constructor() {
    of(1, 2, 3)
      .pipe(
        map((v) => {
          if (v === 2) throw new Error('Value 2 is forbidden!');
          return v;
        }),
        catchError((e: Error) => of(`Error: ${e.message}`))
      )
      .subscribe((v) => this.msg.set(String(v)));
  }
}

// ─────────────────────────────────────────────
// Ex36 — Completed observable cleanup
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-36',
  standalone: true,
  template: `<div><strong>Ex36 completed cleanup:</strong> {{ status() }}</div>`,
})
export class Ex36 {
  status = signal('running…');
  constructor() {
    of(1, 2, 3).subscribe({
      complete: () => this.status.set('Observable completed, resources freed'),
    });
  }
}

// ─────────────────────────────────────────────
// Ex37 — Observable merging from parent and child signals
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-37',
  standalone: true,
  imports: [AsyncPipe],
  template: `<div><strong>Ex37 merge parent+child signals:</strong> {{ merged$ | async }}</div>`,
})
export class Ex37 {
  private parentSubject = new Subject<string>();
  private childSubject = new Subject<string>();
  merged$ = merge(this.parentSubject, this.childSubject);
  constructor() {
    setTimeout(() => this.parentSubject.next('Parent emitted'), 500);
    setTimeout(() => this.childSubject.next('Child emitted'), 1000);
    setTimeout(() => this.parentSubject.next('Parent again'), 1500);
  }
}

// ─────────────────────────────────────────────
// Ex38 — Observable lifecycle summary
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-38',
  standalone: true,
  template: `<div><strong>Ex38 lifecycle log:</strong> {{ log() }}</div>`,
})
export class Ex38 {
  log = signal('');
  constructor() {
    const events: string[] = [];
    of(1, 2, 3)
      .pipe(tap((v) => events.push(`next(${v})`)))
      .subscribe({
        complete: () => {
          events.push('complete');
          this.log.set(events.join(' → '));
        },
      });
  }
}

// ─────────────────────────────────────────────
// Ex39 — Custom Observable creation (new Observable())
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-39',
  standalone: true,
  template: `<div><strong>Ex39 new Observable():</strong> {{ vals() | json }}</div>`,
  imports: [CommonModule],
})
export class Ex39 {
  vals = signal<number[]>([]);
  constructor() {
    const custom$ = new Observable<number>((subscriber) => {
      subscriber.next(100);
      subscriber.next(200);
      subscriber.next(300);
      subscriber.complete();
      return () => console.log('Ex39 teardown');
    });
    const acc: number[] = [];
    custom$.subscribe((v) => {
      acc.push(v);
      this.vals.set([...acc]);
    });
  }
}

// ─────────────────────────────────────────────
// Ex40 — Custom operator via pipe
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-40',
  standalone: true,
  template: `<div><strong>Ex40 custom pipeable operator:</strong> {{ vals() | json }}</div>`,
  imports: [CommonModule],
})
export class Ex40 {
  vals = signal<string[]>([]);
  constructor() {
    const addPrefix =
      (prefix: string) =>
      (src$: Observable<number>): Observable<string> =>
        src$.pipe(map((v) => `${prefix}${v}`));

    const acc: string[] = [];
    of(1, 2, 3)
      .pipe(addPrefix('item-'))
      .subscribe((v) => {
        acc.push(v);
        this.vals.set([...acc]);
      });
  }
}

// ─────────────────────────────────────────────
// Ex41 — Lazy Observable (created only on subscribe)
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-41',
  standalone: true,
  template: `
    <div>
      <strong>Ex41 lazy Observable:</strong> {{ result() }}
      <button (click)="subscribe()">Subscribe Now</button>
    </div>`,
})
export class Ex41 {
  result = signal('not subscribed yet');
  lazy$ = defer(() => of(`Lazy value at ${new Date().toLocaleTimeString()}`));
  subscribe() {
    this.lazy$.subscribe((v) => this.result.set(v));
  }
}

// ─────────────────────────────────────────────
// Ex42 — Observable from EventEmitter
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-42',
  standalone: true,
  template: `
    <div>
      <strong>Ex42 Observable from Subject (EventEmitter-like):</strong> {{ last() }}
      <button (click)="fire()">Fire Event</button>
    </div>`,
})
export class Ex42 {
  private emitter = new Subject<string>();
  last = signal('none');
  private destroyRef = inject(DestroyRef);
  constructor() {
    this.emitter
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => this.last.set(v));
  }
  fire() {
    this.emitter.next(`event-${Date.now()}`);
  }
}

// ─────────────────────────────────────────────
// Ex43 — Observable with backpressure concept
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-43',
  standalone: true,
  template: `<div><strong>Ex43 backpressure (throttleTime):</strong> {{ val() }}</div>`,
})
export class Ex43 {
  private destroyRef = inject(DestroyRef);
  val = signal(0);
  constructor() {
    interval(100)
      .pipe(throttleTime(500), takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => this.val.set(v));
  }
}

// ─────────────────────────────────────────────
// Ex44 — Hot vs Cold observable demo
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-44',
  standalone: true,
  template: `
    <div>
      <strong>Ex44 hot vs cold:</strong>
      cold (own sequence): {{ cold() }} | hot (shared): {{ hot() }}
    </div>`,
})
export class Ex44 {
  private destroyRef = inject(DestroyRef);
  cold = toSignal(interval(400).pipe(take(20)), { initialValue: 0 });
  private shared$ = interval(400).pipe(
    take(20),
    // make it hot via publish + refCount
    publish(),
    refCount()
  ) as Observable<number>;
  hot = toSignal(this.shared$, { initialValue: 0 });
}

// ─────────────────────────────────────────────
// Ex45 — publish() / connect()
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-45',
  standalone: true,
  template: `<div><strong>Ex45 publish()/connect():</strong> {{ val() }}</div>`,
})
export class Ex45 {
  val = signal(0);
  constructor() {
    const cold$ = interval(300).pipe(take(10));
    const hot$ = cold$.pipe(publish()) as ConnectableObservable<number>;
    hot$.subscribe((v) => this.val.set(v));
    hot$.connect();
  }
}

// ─────────────────────────────────────────────
// Ex46 — refCount()
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-46',
  standalone: true,
  template: `<div><strong>Ex46 refCount (auto connect):</strong> A={{ a() }}, B={{ b() }}</div>`,
})
export class Ex46 {
  private destroyRef = inject(DestroyRef);
  private shared$ = interval(600).pipe(
    take(15),
    publish(),
    refCount()
  ) as Observable<number>;
  a = toSignal(this.shared$, { initialValue: 0 });
  b = toSignal(this.shared$.pipe(map((v) => v * 10)), { initialValue: 0 });
}

// ─────────────────────────────────────────────
// Ex47 — multicast()
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-47',
  standalone: true,
  template: `<div><strong>Ex47 multicast Subject:</strong> {{ val() }}</div>`,
})
export class Ex47 {
  val = signal(0);
  constructor() {
    const subject = new Subject<number>();
    const multicasted$ = interval(400).pipe(
      take(10),
      multicast(subject)
    ) as ConnectableObservable<number>;
    multicasted$.subscribe((v) => this.val.set(v));
    multicasted$.connect();
  }
}

// ─────────────────────────────────────────────
// Ex48 — cold-to-hot conversion
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-48',
  standalone: true,
  template: `
    <div>
      <strong>Ex48 cold→hot:</strong> sub1={{ s1() }}, sub2={{ s2() }}
      (same source, different start times)
    </div>`,
})
export class Ex48 {
  private destroyRef = inject(DestroyRef);
  private hot$ = interval(500).pipe(
    take(20),
    publish(),
    refCount()
  ) as Observable<number>;
  s1 = toSignal(this.hot$, { initialValue: -1 });
  s2 = toSignal(
    new Observable<number>((obs) =>
      setTimeout(() => this.hot$.subscribe(obs), 1500)
    ),
    { initialValue: -1 }
  );
}

// ─────────────────────────────────────────────
// Ex49 — Observable with retry on error
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-49',
  standalone: true,
  template: `<div><strong>Ex49 retry on error:</strong> {{ msg() }}</div>`,
})
export class Ex49 {
  msg = signal('');
  private attempts = 0;
  constructor() {
    new Observable<string>((obs) => {
      this.attempts++;
      if (this.attempts < 3) {
        obs.error(new Error(`Attempt ${this.attempts} failed`));
      } else {
        obs.next(`Succeeded on attempt ${this.attempts}`);
        obs.complete();
      }
    })
      .pipe(
        retry(3),
        catchError((e: Error) => of(`Final error: ${e.message}`))
      )
      .subscribe((v) => this.msg.set(v));
  }
}

// ─────────────────────────────────────────────
// Ex50 — Full pipeline: create→transform→combine→display
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-50',
  standalone: true,
  imports: [AsyncPipe],
  template: `<div><strong>Ex50 full pipeline:</strong> {{ pipeline$ | async }}</div>`,
})
export class Ex50 {
  private a$ = interval(400).pipe(take(8), map((v) => v + 1));
  private b$ = interval(600).pipe(take(6), map((v) => (v + 1) * 10));
  pipeline$ = merge(this.a$, this.b$).pipe(
    scan((acc, v) => [...acc, v], [] as number[]),
    map((arr) => `[${arr.join(', ')}]`)
  );
}

// ─────────────────────────────────────────────
// AppComponent — renders all 50 examples
// ─────────────────────────────────────────────
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    Ex01, Ex02, Ex03, Ex04, Ex05, Ex06, Ex07, Ex08, Ex09, Ex10,
    Ex11, Ex12, Ex13, Ex14, Ex15, Ex16, Ex17, Ex18, Ex19, Ex20,
    Ex21, Ex22, Ex23, Ex24, Ex25, Ex26, Ex27, Ex28, Ex29, Ex30,
    Ex31, Ex32, Ex33, Ex34, Ex35, Ex36, Ex37, Ex38, Ex39, Ex40,
    Ex41, Ex42, Ex43, Ex44, Ex45, Ex46, Ex47, Ex48, Ex49, Ex50,
  ],
  template: `
    <div style="font-family:sans-serif;max-width:860px;margin:0 auto;padding:20px">
      <h1>Phase 5 — RxJS: 01 Observables</h1>
      <h4>Ex01 — of() display values</h4><ex-01 /><hr />
      <h4>Ex02 — from() array</h4><ex-02 /><hr />
      <h4>Ex03 — from() Promise</h4><ex-03 /><hr />
      <h4>Ex04 — interval() with async pipe</h4><ex-04 /><hr />
      <h4>Ex05 — timer() single fire</h4><ex-05 /><hr />
      <h4>Ex06 — timer(delay, interval)</h4><ex-06 /><hr />
      <h4>Ex07 — EMPTY observable</h4><ex-07 /><hr />
      <h4>Ex08 — NEVER observable</h4><ex-08 /><hr />
      <h4>Ex09 — throwError()</h4><ex-09 /><hr />
      <h4>Ex10 — range(1,10)</h4><ex-10 /><hr />
      <h4>Ex11 — generate()</h4><ex-11 /><hr />
      <h4>Ex12 — defer()</h4><ex-12 /><hr />
      <h4>Ex13 — iif()</h4><ex-13 /><hr />
      <h4>Ex14 — subscribe with observer object</h4><ex-14 /><hr />
      <h4>Ex15 — subscribe next/error/complete</h4><ex-15 /><hr />
      <h4>Ex16 — takeUntilDestroyed pattern</h4><ex-16 /><hr />
      <h4>Ex17 — take(3) limited subscription</h4><ex-17 /><hr />
      <h4>Ex18 — toSignal() from Observable</h4><ex-18 /><hr />
      <h4>Ex19 — toSignal() with initialValue</h4><ex-19 /><hr />
      <h4>Ex20 — async pipe with observable</h4><ex-20 /><hr />
      <h4>Ex21 — BehaviorSubject.asObservable()</h4><ex-21 /><hr />
      <h4>Ex22 — Subject emit and listen</h4><ex-22 /><hr />
      <h4>Ex23 — fromEvent on button click</h4><ex-23 /><hr />
      <h4>Ex24 — fromEvent keyboard</h4><ex-24 /><hr />
      <h4>Ex25 — fromEvent scroll throttle</h4><ex-25 /><hr />
      <h4>Ex26 — webSocket concept demo</h4><ex-26 /><hr />
      <h4>Ex27 — Parent creating Observable, child subscribing via @Input</h4><ex-27 /><hr />
      <h4>Ex28 — Observable chain in template</h4><ex-28 /><hr />
      <h4>Ex29 — Observable with multiple subscribers</h4><ex-29 /><hr />
      <h4>Ex30 — Observable passed as @Input</h4><ex-30 /><hr />
      <h4>Ex31 — Observable from service</h4><ex-31 /><hr />
      <h4>Ex32 — Multiple Observable subscriptions in one component</h4><ex-32 /><hr />
      <h4>Ex33 — Observable + signal combo</h4><ex-33 /><hr />
      <h4>Ex34 — Observable-driven animation</h4><ex-34 /><hr />
      <h4>Ex35 — Error in observable chain displayed</h4><ex-35 /><hr />
      <h4>Ex36 — Completed observable cleanup</h4><ex-36 /><hr />
      <h4>Ex37 — Observable merging from parent and child signals</h4><ex-37 /><hr />
      <h4>Ex38 — Observable lifecycle summary</h4><ex-38 /><hr />
      <h4>Ex39 — Custom Observable creation (new Observable())</h4><ex-39 /><hr />
      <h4>Ex40 — Custom pipeable operator</h4><ex-40 /><hr />
      <h4>Ex41 — Lazy Observable</h4><ex-41 /><hr />
      <h4>Ex42 — Observable from EventEmitter</h4><ex-42 /><hr />
      <h4>Ex43 — Observable with backpressure concept</h4><ex-43 /><hr />
      <h4>Ex44 — Hot vs Cold observable</h4><ex-44 /><hr />
      <h4>Ex45 — publish()/connect()</h4><ex-45 /><hr />
      <h4>Ex46 — refCount()</h4><ex-46 /><hr />
      <h4>Ex47 — multicast()</h4><ex-47 /><hr />
      <h4>Ex48 — Cold-to-hot conversion</h4><ex-48 /><hr />
      <h4>Ex49 — Observable with retry on error</h4><ex-49 /><hr />
      <h4>Ex50 — Full Observable pipeline</h4><ex-50 /><hr />
    </div>`,
})
export class AppComponent {}
