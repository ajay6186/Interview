import {
  Component,
  OnInit,
  Input,
  signal,
  inject,
  DestroyRef,
} from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  Observable,
  of,
  from,
  interval,
  timer,
  Subject,
  BehaviorSubject,
  forkJoin,
  merge,
  concat,
} from 'rxjs';
import {
  map,
  filter,
  tap,
  take,
  skip,
  first,
  last,
  takeLast,
  takeWhile,
  skipWhile,
  scan,
  reduce,
  pluck,
  switchMap,
  mergeMap,
  concatMap,
  exhaustMap,
  flatMap,
  mapTo,
  debounceTime,
  distinctUntilChanged,
  catchError,
  delay,
  groupBy,
  window,
  buffer,
  expand,
  mergeScan,
  auditTime,
  sampleTime,
  throttleTime,
} from 'rxjs/operators';

// ─────────────────────────────────────────────
// Ex01 — map(x => x*2)
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-01',
  standalone: true,
  template: `<div><strong>Ex01 map(x*2):</strong> {{ vals() | json }}</div>`,
  imports: [CommonModule],
})
export class Ex01 {
  vals = signal<number[]>([]);
  constructor() {
    const acc: number[] = [];
    of(1, 2, 3, 4, 5)
      .pipe(map((x) => x * 2))
      .subscribe((v) => {
        acc.push(v);
        this.vals.set([...acc]);
      });
  }
}

// ─────────────────────────────────────────────
// Ex02 — filter(x => x > 0)
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-02',
  standalone: true,
  template: `<div><strong>Ex02 filter(x>0):</strong> {{ vals() | json }}</div>`,
  imports: [CommonModule],
})
export class Ex02 {
  vals = signal<number[]>([]);
  constructor() {
    const acc: number[] = [];
    of(-2, -1, 0, 1, 2, 3)
      .pipe(filter((x) => x > 0))
      .subscribe((v) => {
        acc.push(v);
        this.vals.set([...acc]);
      });
  }
}

// ─────────────────────────────────────────────
// Ex03 — tap(console.log)
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-03',
  standalone: true,
  template: `<div><strong>Ex03 tap (side-effect):</strong> {{ vals() | json }} (check console)</div>`,
  imports: [CommonModule],
})
export class Ex03 {
  vals = signal<number[]>([]);
  constructor() {
    const acc: number[] = [];
    of(10, 20, 30)
      .pipe(tap((v) => console.log('[Ex03 tap]', v)))
      .subscribe((v) => {
        acc.push(v);
        this.vals.set([...acc]);
      });
  }
}

// ─────────────────────────────────────────────
// Ex04 — take(5)
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-04',
  standalone: true,
  template: `<div><strong>Ex04 take(5):</strong> {{ vals() | json }}</div>`,
  imports: [CommonModule],
})
export class Ex04 {
  vals = toSignal(
    interval(300).pipe(
      take(5),
      scan((acc, v) => [...acc, v], [] as number[])
    ),
    { initialValue: [] as number[] }
  );
}

// ─────────────────────────────────────────────
// Ex05 — skip(2)
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-05',
  standalone: true,
  template: `<div><strong>Ex05 skip(2):</strong> {{ vals() | json }}</div>`,
  imports: [CommonModule],
})
export class Ex05 {
  vals = signal<number[]>([]);
  constructor() {
    const acc: number[] = [];
    of(1, 2, 3, 4, 5)
      .pipe(skip(2))
      .subscribe((v) => {
        acc.push(v);
        this.vals.set([...acc]);
      });
  }
}

// ─────────────────────────────────────────────
// Ex06 — first()
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-06',
  standalone: true,
  template: `<div><strong>Ex06 first():</strong> {{ val() }}</div>`,
})
export class Ex06 {
  val = signal(0);
  constructor() {
    of(10, 20, 30).pipe(first()).subscribe((v) => this.val.set(v));
  }
}

// ─────────────────────────────────────────────
// Ex07 — last()
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-07',
  standalone: true,
  template: `<div><strong>Ex07 last():</strong> {{ val() }}</div>`,
})
export class Ex07 {
  val = signal(0);
  constructor() {
    of(10, 20, 30).pipe(last()).subscribe((v) => this.val.set(v));
  }
}

// ─────────────────────────────────────────────
// Ex08 — takeLast(3)
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-08',
  standalone: true,
  template: `<div><strong>Ex08 takeLast(3):</strong> {{ vals() | json }}</div>`,
  imports: [CommonModule],
})
export class Ex08 {
  vals = signal<number[]>([]);
  constructor() {
    of(1, 2, 3, 4, 5, 6, 7)
      .pipe(takeLast(3))
      .subscribe((v) => this.vals.update((a) => [...a, v]));
  }
}

// ─────────────────────────────────────────────
// Ex09 — takeWhile()
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-09',
  standalone: true,
  template: `<div><strong>Ex09 takeWhile(x&lt;5):</strong> {{ vals() | json }}</div>`,
  imports: [CommonModule],
})
export class Ex09 {
  vals = signal<number[]>([]);
  constructor() {
    of(1, 2, 3, 4, 5, 6, 7)
      .pipe(takeWhile((x) => x < 5))
      .subscribe((v) => this.vals.update((a) => [...a, v]));
  }
}

// ─────────────────────────────────────────────
// Ex10 — skipWhile()
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-10',
  standalone: true,
  template: `<div><strong>Ex10 skipWhile(x&lt;4):</strong> {{ vals() | json }}</div>`,
  imports: [CommonModule],
})
export class Ex10 {
  vals = signal<number[]>([]);
  constructor() {
    of(1, 2, 3, 4, 5, 6)
      .pipe(skipWhile((x) => x < 4))
      .subscribe((v) => this.vals.update((a) => [...a, v]));
  }
}

// ─────────────────────────────────────────────
// Ex11 — scan (running total)
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-11',
  standalone: true,
  template: `<div><strong>Ex11 scan running total:</strong> {{ total() }}</div>`,
})
export class Ex11 {
  total = toSignal(
    interval(500).pipe(
      take(10),
      map((v) => v + 1),
      scan((acc, v) => acc + v, 0)
    ),
    { initialValue: 0 }
  );
}

// ─────────────────────────────────────────────
// Ex12 — reduce (final sum)
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-12',
  standalone: true,
  template: `<div><strong>Ex12 reduce final sum:</strong> {{ sum() }}</div>`,
})
export class Ex12 {
  sum = signal(0);
  constructor() {
    of(1, 2, 3, 4, 5)
      .pipe(reduce((acc, v) => acc + v, 0))
      .subscribe((v) => this.sum.set(v));
  }
}

// ─────────────────────────────────────────────
// Ex13 — map to property (replaces pluck)
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-13',
  standalone: true,
  template: `<div><strong>Ex13 map to property:</strong> {{ names() | json }}</div>`,
  imports: [CommonModule],
})
export class Ex13 {
  names = signal<string[]>([]);
  constructor() {
    const acc: string[] = [];
    of(
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
      { name: 'Carol', age: 35 }
    )
      .pipe(map((obj) => obj.name))
      .subscribe((v) => {
        acc.push(v);
        this.names.set([...acc]);
      });
  }
}

// ─────────────────────────────────────────────
// Ex14 — switchMap with search input
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-14',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div>
      <strong>Ex14 switchMap search:</strong>
      <input [(ngModel)]="query" placeholder="type to search" (ngModelChange)="onSearch($event)" />
      <span>Result: {{ result() }}</span>
    </div>`,
})
export class Ex14 {
  query = '';
  result = signal('');
  private search$ = new Subject<string>();
  private destroyRef = inject(DestroyRef);
  constructor() {
    this.search$
      .pipe(
        debounceTime(400),
        switchMap((q) =>
          q ? timer(300).pipe(map(() => `Results for "${q}"`)) : of('type something')
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((v) => this.result.set(v));
  }
  onSearch(q: string) {
    this.search$.next(q);
  }
}

// ─────────────────────────────────────────────
// Ex15 — switchMap cancels previous
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-15',
  standalone: true,
  template: `
    <div>
      <strong>Ex15 switchMap cancels previous:</strong> {{ result() }}
      <button (click)="trigger()">Trigger (rapid click cancels previous)</button>
    </div>`,
})
export class Ex15 {
  result = signal('');
  private click$ = new Subject<void>();
  private destroyRef = inject(DestroyRef);
  constructor() {
    this.click$
      .pipe(
        switchMap(() => timer(1000).pipe(map(() => `Completed at ${new Date().toLocaleTimeString()}`))),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((v) => this.result.set(v));
  }
  trigger() {
    this.result.set('pending (1s)…');
    this.click$.next();
  }
}

// ─────────────────────────────────────────────
// Ex16 — mergeMap concurrent
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-16',
  standalone: true,
  template: `<div><strong>Ex16 mergeMap concurrent:</strong> {{ log() }}</div>`,
})
export class Ex16 {
  log = signal('');
  private destroyRef = inject(DestroyRef);
  constructor() {
    const msgs: string[] = [];
    of(1, 2, 3)
      .pipe(
        mergeMap((v) => timer(Math.random() * 800).pipe(map(() => `task-${v} done`))),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((v) => {
        msgs.push(v);
        this.log.set(msgs.join(', '));
      });
  }
}

// ─────────────────────────────────────────────
// Ex17 — concatMap sequential
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-17',
  standalone: true,
  template: `<div><strong>Ex17 concatMap sequential:</strong> {{ log() }}</div>`,
})
export class Ex17 {
  log = signal('');
  constructor() {
    const msgs: string[] = [];
    of(1, 2, 3)
      .pipe(concatMap((v) => timer(300).pipe(map(() => `task-${v}`))))
      .subscribe({
        next: (v) => {
          msgs.push(v);
          this.log.set(msgs.join(' → '));
        },
      });
  }
}

// ─────────────────────────────────────────────
// Ex18 — exhaustMap preventing double-submit
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-18',
  standalone: true,
  template: `
    <div>
      <strong>Ex18 exhaustMap (no double-submit):</strong> {{ status() }}
      <button (click)="submit()">Submit</button>
    </div>`,
})
export class Ex18 {
  status = signal('idle');
  private click$ = new Subject<void>();
  private destroyRef = inject(DestroyRef);
  constructor() {
    this.click$
      .pipe(
        exhaustMap(() => {
          this.status.set('submitting…');
          return timer(1500).pipe(map(() => 'done'));
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.status.set('idle'));
  }
  submit() {
    this.click$.next();
  }
}

// ─────────────────────────────────────────────
// Ex19 — switchMap vs mergeMap demo
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-19',
  standalone: true,
  template: `
    <div>
      <strong>Ex19 switchMap vs mergeMap:</strong>
      switch={{ sw() }}, merge={{ mg() }}
      <button (click)="trigger()">Trigger both</button>
    </div>`,
})
export class Ex19 {
  sw = signal('');
  mg = signal('');
  private sw$ = new Subject<void>();
  private mg$ = new Subject<void>();
  private destroyRef = inject(DestroyRef);
  constructor() {
    this.sw$
      .pipe(switchMap(() => timer(600).pipe(map(() => `sw@${new Date().toLocaleTimeString()}`))), takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => this.sw.set(v));
    this.mg$
      .pipe(mergeMap(() => timer(600).pipe(map(() => `mg@${new Date().toLocaleTimeString()}`))), takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => this.mg.set(v));
  }
  trigger() {
    this.sw$.next();
    this.mg$.next();
  }
}

// ─────────────────────────────────────────────
// Ex20 — concatMap queue
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-20',
  standalone: true,
  template: `
    <div>
      <strong>Ex20 concatMap queue:</strong> {{ queue() }}
      <button (click)="add()">Add task</button>
    </div>`,
})
export class Ex20 {
  queue = signal('');
  private task$ = new Subject<number>();
  private taskId = 0;
  private destroyRef = inject(DestroyRef);
  constructor() {
    this.task$
      .pipe(
        concatMap((id) => timer(600).pipe(map(() => `T${id}`))),
        scan((acc, v) => [...acc, v], [] as string[]),
        map((arr) => arr.join(' → ')),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((v) => this.queue.set(v));
  }
  add() {
    this.task$.next(++this.taskId);
  }
}

// ─────────────────────────────────────────────
// Ex21 — exhaustMap ignore while busy
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-21',
  standalone: true,
  template: `
    <div>
      <strong>Ex21 exhaustMap ignore while busy:</strong> {{ count() }} completed
      <button (click)="click()">Click (ignored if busy)</button>
    </div>`,
})
export class Ex21 {
  count = signal(0);
  private click$ = new Subject<void>();
  private destroyRef = inject(DestroyRef);
  constructor() {
    this.click$
      .pipe(
        exhaustMap(() => timer(1000)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.count.update((n) => n + 1));
  }
  click() {
    this.click$.next();
  }
}

// ─────────────────────────────────────────────
// Ex22 — flatMap (alias mergeMap)
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-22',
  standalone: true,
  template: `<div><strong>Ex22 flatMap (mergeMap alias):</strong> {{ vals() | json }}</div>`,
  imports: [CommonModule],
})
export class Ex22 {
  vals = signal<number[]>([]);
  constructor() {
    of(1, 2, 3)
      .pipe(flatMap((v) => of(v * 100, v * 200)))
      .subscribe((v) => this.vals.update((a) => [...a, v]));
  }
}

// ─────────────────────────────────────────────
// Ex23 — map(() => val) (replaces deprecated mapTo)
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-23',
  standalone: true,
  template: `<div><strong>Ex23 map(() => val) (mapTo pattern):</strong> {{ vals() | json }}</div>`,
  imports: [CommonModule],
})
export class Ex23 {
  vals = signal<string[]>([]);
  constructor() {
    of(1, 2, 3)
      .pipe(map(() => 'CLICK'))
      .subscribe((v) => this.vals.update((a) => [...a, v]));
  }
}

// ─────────────────────────────────────────────
// Ex24 — mergeMap with forkJoin
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-24',
  standalone: true,
  template: `<div><strong>Ex24 mergeMap + forkJoin:</strong> {{ result() | json }}</div>`,
  imports: [CommonModule],
})
export class Ex24 {
  result = signal<number[]>([]);
  constructor() {
    of([1, 2, 3])
      .pipe(
        mergeMap((ids) =>
          forkJoin(ids.map((id) => timer(200).pipe(map(() => id * 10))))
        )
      )
      .subscribe((v) => this.result.set(v));
  }
}

// ─────────────────────────────────────────────
// Ex25 — switchMap chained HTTP calls (simulated)
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-25',
  standalone: true,
  template: `<div><strong>Ex25 switchMap chained calls:</strong> {{ result() }}</div>`,
})
export class Ex25 {
  result = signal('loading…');
  constructor() {
    // Simulate: get user → then get posts
    timer(300)
      .pipe(
        map(() => ({ userId: 1, name: 'Alice' })),
        switchMap((user) =>
          timer(300).pipe(map(() => `User: ${user.name}, Posts: [post-1, post-2]`))
        )
      )
      .subscribe((v) => this.result.set(v));
  }
}

// ─────────────────────────────────────────────
// Ex26 — concatMap with delay queue
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-26',
  standalone: true,
  template: `<div><strong>Ex26 concatMap delay queue:</strong> {{ log() }}</div>`,
})
export class Ex26 {
  log = signal('');
  constructor() {
    const steps: string[] = [];
    from(['step-A', 'step-B', 'step-C'])
      .pipe(concatMap((s) => timer(400).pipe(map(() => s))))
      .subscribe({
        next: (v) => {
          steps.push(v);
          this.log.set(steps.join(' → '));
        },
      });
  }
}

// ─────────────────────────────────────────────
// Ex27 — switchMap in search component
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-27',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div>
      <strong>Ex27 switchMap search component:</strong>
      <input [(ngModel)]="term" (ngModelChange)="search$.next($event)" placeholder="search" />
      {{ results() | json }}
    </div>`,
  imports: [FormsModule, CommonModule],
})
export class Ex27 {
  term = '';
  results = signal<string[]>([]);
  search$ = new Subject<string>();
  private destroyRef = inject(DestroyRef);
  constructor() {
    this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) =>
          q
            ? timer(200).pipe(map(() => [`${q}-result-1`, `${q}-result-2`]))
            : of([])
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((v) => this.results.set(v));
  }
}

// ─────────────────────────────────────────────
// Ex28 — mergeMap for parallel operations
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-28',
  standalone: true,
  template: `<div><strong>Ex28 mergeMap parallel:</strong> {{ log() }}</div>`,
})
export class Ex28 {
  log = signal('');
  constructor() {
    const results: string[] = [];
    of('img-1', 'img-2', 'img-3')
      .pipe(mergeMap((name) => timer(Math.random() * 500 + 100).pipe(map(() => `${name} loaded`))))
      .subscribe({
        next: (v) => {
          results.push(v);
          this.log.set(results.join(', '));
        },
      });
  }
}

// ─────────────────────────────────────────────
// Ex29 — concatMap for upload queue
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-29',
  standalone: true,
  template: `<div><strong>Ex29 concatMap upload queue:</strong> {{ status() }}</div>`,
})
export class Ex29 {
  status = signal('');
  constructor() {
    const uploaded: string[] = [];
    from(['file-A.pdf', 'file-B.jpg', 'file-C.png'])
      .pipe(concatMap((file) => timer(400).pipe(map(() => `${file} uploaded`))))
      .subscribe({
        next: (v) => {
          uploaded.push(v);
          this.status.set(uploaded.join(', '));
        },
      });
  }
}

// ─────────────────────────────────────────────
// Ex30 — exhaustMap for form submit
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-30',
  standalone: true,
  template: `
    <div>
      <strong>Ex30 exhaustMap form submit:</strong> {{ status() }}
      <button (click)="submit$.next()">Submit</button>
    </div>`,
})
export class Ex30 {
  status = signal('idle');
  submit$ = new Subject<void>();
  private destroyRef = inject(DestroyRef);
  constructor() {
    this.submit$
      .pipe(
        exhaustMap(() => {
          this.status.set('submitting…');
          return timer(1200).pipe(map(() => 'success'));
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((v) => this.status.set(v));
  }
}

// ─────────────────────────────────────────────
// Ex31 — switchMap + debounceTime + distinctUntilChanged (typeahead)
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-31',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div>
      <strong>Ex31 Typeahead:</strong>
      <input [(ngModel)]="q" (ngModelChange)="input$.next($event)" placeholder="type…" />
      <ul>@for (r of results(); track r) { <li>{{ r }}</li> }</ul>
    </div>`,
})
export class Ex31 {
  q = '';
  results = signal<string[]>([]);
  input$ = new Subject<string>();
  private destroyRef = inject(DestroyRef);
  private db = ['apple', 'apricot', 'banana', 'blueberry', 'cherry', 'citrus'];
  constructor() {
    this.input$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) =>
          q ? of(this.db.filter((f) => f.startsWith(q.toLowerCase()))) : of([])
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((v) => this.results.set(v));
  }
}

// ─────────────────────────────────────────────
// Ex32 — ConcatMap processing list one-by-one
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-32',
  standalone: true,
  template: `<div><strong>Ex32 concatMap one-by-one:</strong> {{ current() }}</div>`,
})
export class Ex32 {
  current = signal('');
  constructor() {
    from([1, 2, 3, 4, 5])
      .pipe(concatMap((v) => timer(300).pipe(map(() => `Processing item ${v}`))))
      .subscribe((v) => this.current.set(v));
  }
}

// ─────────────────────────────────────────────
// Ex33 — MergeMap showing concurrent results
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-33',
  standalone: true,
  imports: [CommonModule],
  template: `<div><strong>Ex33 mergeMap concurrent results:</strong> {{ done() | json }}</div>`,
})
export class Ex33 {
  done = signal<string[]>([]);
  constructor() {
    from(['A', 'B', 'C', 'D'])
      .pipe(mergeMap((id) => timer(Math.random() * 600 + 100).pipe(map(() => `${id} done`))))
      .subscribe((v) => this.done.update((a) => [...a, v]));
  }
}

// ─────────────────────────────────────────────
// Ex34 — ExhaustMap rapid-click demo
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-34',
  standalone: true,
  template: `
    <div>
      <strong>Ex34 exhaustMap rapid-click:</strong> clicks={{ clicks() }}, fired={{ fired() }}
      <button (click)="onClick()">Rapid click</button>
    </div>`,
})
export class Ex34 {
  clicks = signal(0);
  fired = signal(0);
  private click$ = new Subject<void>();
  private destroyRef = inject(DestroyRef);
  constructor() {
    this.click$
      .pipe(exhaustMap(() => timer(800)), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.fired.update((n) => n + 1));
  }
  onClick() {
    this.clicks.update((n) => n + 1);
    this.click$.next();
  }
}

// ─────────────────────────────────────────────
// Ex35 — Nested switchMap (outer + inner)
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-35',
  standalone: true,
  template: `<div><strong>Ex35 nested switchMap:</strong> {{ result() }}</div>`,
})
export class Ex35 {
  result = signal('loading…');
  private destroyRef = inject(DestroyRef);
  constructor() {
    interval(2000)
      .pipe(
        take(3),
        switchMap((outer) =>
          interval(500).pipe(
            take(3),
            map((inner) => `outer=${outer}, inner=${inner}`)
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((v) => this.result.set(v));
  }
}

// ─────────────────────────────────────────────
// Ex36 — SwitchMap with error handling
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-36',
  standalone: true,
  template: `
    <div>
      <strong>Ex36 switchMap + error handling:</strong> {{ result() }}
      <button (click)="search$.next(shouldFail ? 'fail' : 'ok'); shouldFail = !shouldFail">
        Toggle fail/ok
      </button>
    </div>`,
})
export class Ex36 {
  result = signal('');
  shouldFail = false;
  search$ = new Subject<string>();
  private destroyRef = inject(DestroyRef);
  constructor() {
    this.search$
      .pipe(
        switchMap((q) => {
          if (q === 'fail') return throwError(() => new Error('Request failed'));
          return timer(300).pipe(map(() => `Result for "${q}"`));
        }),
        catchError((e: Error) => of(`Error: ${e.message}`)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((v) => this.result.set(v));
    // re-subscribe after catchError kills stream would need restart — shown in error-handling file
  }
}

// ─────────────────────────────────────────────
// Ex37 — Pipeline: search → debounce → switchMap → display
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-37',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div>
      <strong>Ex37 full search pipeline:</strong>
      <input [(ngModel)]="q" (ngModelChange)="q$.next($event)" placeholder="search" />
      {{ result() }}
    </div>`,
})
export class Ex37 {
  q = '';
  result = signal('');
  q$ = new Subject<string>();
  private destroyRef = inject(DestroyRef);
  constructor() {
    this.q$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        filter((s) => s.length > 1),
        switchMap((q) => timer(200).pipe(map(() => `Found: "${q}" → 3 results`))),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((v) => this.result.set(v));
  }
}

// ─────────────────────────────────────────────
// Ex38 — Full autocomplete component
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-38',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div>
      <strong>Ex38 autocomplete:</strong>
      <input [(ngModel)]="term" (ngModelChange)="term$.next($event)" placeholder="fruit…" />
      @if (loading()) { <span>…</span> }
      <ul>@for (s of suggestions(); track s) { <li>{{ s }}</li> }</ul>
    </div>`,
})
export class Ex38 {
  term = '';
  suggestions = signal<string[]>([]);
  loading = signal(false);
  term$ = new Subject<string>();
  private destroyRef = inject(DestroyRef);
  private fruits = ['apple', 'apricot', 'avocado', 'banana', 'blueberry', 'cherry'];
  constructor() {
    this.term$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.loading.set(true)),
        switchMap((q) =>
          q
            ? timer(250).pipe(map(() => this.fruits.filter((f) => f.includes(q.toLowerCase()))))
            : of([])
        ),
        tap(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((v) => this.suggestions.set(v));
  }
}

// ─────────────────────────────────────────────
// Ex39 — groupBy + mergeMap
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-39',
  standalone: true,
  imports: [CommonModule],
  template: `<div><strong>Ex39 groupBy + mergeMap:</strong> {{ groups() | json }}</div>`,
})
export class Ex39 {
  groups = signal<Record<string, number[]>>({});
  constructor() {
    const data: Record<string, number[]> = {};
    from([
      { cat: 'A', val: 1 },
      { cat: 'B', val: 2 },
      { cat: 'A', val: 3 },
      { cat: 'B', val: 4 },
      { cat: 'C', val: 5 },
    ])
      .pipe(
        groupBy((x) => x.cat),
        mergeMap((group$) =>
          group$.pipe(
            reduce((acc, x) => [...acc, x.val], [] as number[]),
            map((vals) => ({ key: group$.key, vals }))
          )
        )
      )
      .subscribe(({ key, vals }) => {
        data[key] = vals;
        this.groups.set({ ...data });
      });
  }
}

// ─────────────────────────────────────────────
// Ex40 — buffer + map
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-40',
  standalone: true,
  imports: [CommonModule],
  template: `<div><strong>Ex40 buffer + map:</strong> {{ buffers() | json }}</div>`,
})
export class Ex40 {
  buffers = signal<number[][]>([]);
  private destroyRef = inject(DestroyRef);
  constructor() {
    const boundary$ = interval(1000);
    interval(200)
      .pipe(
        buffer(boundary$),
        take(4),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((buf) => this.buffers.update((a) => [...a, buf]));
  }
}

// ─────────────────────────────────────────────
// Ex41 — expand (recursive)
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-41',
  standalone: true,
  imports: [CommonModule],
  template: `<div><strong>Ex41 expand (recursive doubling):</strong> {{ vals() | json }}</div>`,
})
export class Ex41 {
  vals = signal<number[]>([]);
  constructor() {
    const acc: number[] = [];
    of(1)
      .pipe(
        expand((v) => (v < 64 ? of(v * 2) : EMPTY)),
        tap((v) => { acc.push(v); this.vals.set([...acc]); })
      )
      .subscribe();
  }
}

// ─────────────────────────────────────────────
// Ex42 — mergeScan
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-42',
  standalone: true,
  template: `<div><strong>Ex42 mergeScan (async accumulate):</strong> {{ total() }}</div>`,
})
export class Ex42 {
  total = signal(0);
  private destroyRef = inject(DestroyRef);
  constructor() {
    interval(500)
      .pipe(
        take(6),
        map((v) => v + 1),
        mergeScan((acc, v) => timer(100).pipe(map(() => acc + v)), 0),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((v) => this.total.set(v));
  }
}

// ─────────────────────────────────────────────
// Ex43 — auditTime
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-43',
  standalone: true,
  template: `<div><strong>Ex43 auditTime(500):</strong> {{ val() }}</div>`,
})
export class Ex43 {
  private destroyRef = inject(DestroyRef);
  val = toSignal(
    interval(100).pipe(auditTime(500), takeUntilDestroyed(inject(DestroyRef))),
    { initialValue: 0 }
  );
}

// ─────────────────────────────────────────────
// Ex44 — sampleTime
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-44',
  standalone: true,
  template: `<div><strong>Ex44 sampleTime(600):</strong> {{ val() }}</div>`,
})
export class Ex44 {
  val = toSignal(
    interval(100).pipe(sampleTime(600), take(20)),
    { initialValue: 0 }
  );
}

// ─────────────────────────────────────────────
// Ex45 — throttle vs debounce comparison
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-45',
  standalone: true,
  template: `
    <div>
      <strong>Ex45 throttle vs debounce:</strong>
      throttle={{ t() }}, debounce={{ d() }}
    </div>`,
})
export class Ex45 {
  private destroyRef = inject(DestroyRef);
  t = toSignal(
    interval(100).pipe(throttleTime(500), take(30), takeUntilDestroyed(inject(DestroyRef))),
    { initialValue: 0 }
  );
  d = toSignal(
    interval(100).pipe(debounceTime(500), take(5), takeUntilDestroyed(inject(DestroyRef))),
    { initialValue: 0 }
  );
}

// ─────────────────────────────────────────────
// Ex46 — Custom pipeable operator
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-46',
  standalone: true,
  imports: [CommonModule],
  template: `<div><strong>Ex46 custom operator:</strong> {{ vals() | json }}</div>`,
})
export class Ex46 {
  vals = signal<string[]>([]);
  constructor() {
    const doubleAndLabel =
      (label: string) =>
      (src$: Observable<number>): Observable<string> =>
        src$.pipe(
          map((v) => v * 2),
          map((v) => `${label}:${v}`)
        );

    const acc: string[] = [];
    of(1, 2, 3, 4)
      .pipe(doubleAndLabel('item'))
      .subscribe((v) => {
        acc.push(v);
        this.vals.set([...acc]);
      });
  }
}

// ─────────────────────────────────────────────
// Ex47 — Operator composition
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-47',
  standalone: true,
  imports: [CommonModule],
  template: `<div><strong>Ex47 operator composition:</strong> {{ result() | json }}</div>`,
})
export class Ex47 {
  result = signal<string[]>([]);
  constructor() {
    const processNumbers =
      (threshold: number) =>
      (src$: Observable<number>): Observable<string> =>
        src$.pipe(
          filter((v) => v > threshold),
          map((v) => v * 2),
          map((v) => `val:${v}`)
        );

    const acc: string[] = [];
    of(1, 2, 3, 4, 5, 6)
      .pipe(processNumbers(3))
      .subscribe((v) => {
        acc.push(v);
        this.result.set([...acc]);
      });
  }
}

// ─────────────────────────────────────────────
// Ex48 — Custom map with type safety
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-48',
  standalone: true,
  imports: [CommonModule],
  template: `<div><strong>Ex48 typed custom map:</strong> {{ result() | json }}</div>`,
})
export class Ex48 {
  result = signal<{ id: number; label: string }[]>([]);
  constructor() {
    const toLabeled =
      () =>
      (src$: Observable<number>): Observable<{ id: number; label: string }> =>
        src$.pipe(map((id) => ({ id, label: `Item #${id}` })));

    const acc: { id: number; label: string }[] = [];
    of(10, 20, 30)
      .pipe(toLabeled())
      .subscribe((v) => {
        acc.push(v);
        this.result.set([...acc]);
      });
  }
}

// ─────────────────────────────────────────────
// Ex49 — Operator chain composition (reusable pipeline)
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-49',
  standalone: true,
  template: `<div><strong>Ex49 reusable pipeline:</strong> {{ output() }}</div>`,
})
export class Ex49 {
  output = signal('');
  constructor() {
    const searchPipeline =
      (debounce: number) =>
      (src$: Observable<string>): Observable<string> =>
        src$.pipe(
          debounceTime(debounce),
          distinctUntilChanged(),
          filter((s) => s.length >= 2),
          map((s) => `Searching: "${s}"`)
        );

    const queries$ = new Subject<string>();
    queries$.pipe(searchPipeline(100)).subscribe((v) => this.output.set(v));

    setTimeout(() => queries$.next('a'), 0);
    setTimeout(() => queries$.next('an'), 50);
    setTimeout(() => queries$.next('ang'), 200);
    setTimeout(() => queries$.next('angu'), 250);
    setTimeout(() => queries$.next('angular'), 400);
  }
}

// ─────────────────────────────────────────────
// Ex50 — Full pipeline operator chain demo
// ─────────────────────────────────────────────
@Component({
  selector: 'ex-50',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    <div>
      <strong>Ex50 full pipeline:</strong>
      <div>{{ pipeline$ | async }}</div>
    </div>`,
})
export class Ex50 {
  pipeline$ = interval(300).pipe(
    take(20),
    filter((v) => v % 2 === 0),
    map((v) => v * 3),
    scan(
      (state, v) => ({ sum: state.sum + v, count: state.count + 1 }),
      { sum: 0, count: 0 }
    ),
    map(({ sum, count }) => `count=${count}, sum=${sum}, avg=${(sum / count).toFixed(1)}`)
  );
}

// Needed for Ex41's EMPTY reference
import { EMPTY } from 'rxjs';
import { throwError } from 'rxjs';

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
      <h1>Phase 5 — RxJS: 02 Transformation Operators</h1>
      <h4>Ex01 — map(x => x*2)</h4><ex-01 /><hr />
      <h4>Ex02 — filter(x => x>0)</h4><ex-02 /><hr />
      <h4>Ex03 — tap(console.log)</h4><ex-03 /><hr />
      <h4>Ex04 — take(5)</h4><ex-04 /><hr />
      <h4>Ex05 — skip(2)</h4><ex-05 /><hr />
      <h4>Ex06 — first()</h4><ex-06 /><hr />
      <h4>Ex07 — last()</h4><ex-07 /><hr />
      <h4>Ex08 — takeLast(3)</h4><ex-08 /><hr />
      <h4>Ex09 — takeWhile()</h4><ex-09 /><hr />
      <h4>Ex10 — skipWhile()</h4><ex-10 /><hr />
      <h4>Ex11 — scan running total</h4><ex-11 /><hr />
      <h4>Ex12 — reduce final sum</h4><ex-12 /><hr />
      <h4>Ex13 — map to property</h4><ex-13 /><hr />
      <h4>Ex14 — switchMap with search input</h4><ex-14 /><hr />
      <h4>Ex15 — switchMap cancels previous</h4><ex-15 /><hr />
      <h4>Ex16 — mergeMap concurrent</h4><ex-16 /><hr />
      <h4>Ex17 — concatMap sequential</h4><ex-17 /><hr />
      <h4>Ex18 — exhaustMap preventing double-submit</h4><ex-18 /><hr />
      <h4>Ex19 — switchMap vs mergeMap</h4><ex-19 /><hr />
      <h4>Ex20 — concatMap queue</h4><ex-20 /><hr />
      <h4>Ex21 — exhaustMap ignore while busy</h4><ex-21 /><hr />
      <h4>Ex22 — flatMap (alias mergeMap)</h4><ex-22 /><hr />
      <h4>Ex23 — map(() => val) (mapTo pattern)</h4><ex-23 /><hr />
      <h4>Ex24 — mergeMap with forkJoin</h4><ex-24 /><hr />
      <h4>Ex25 — switchMap chained HTTP calls</h4><ex-25 /><hr />
      <h4>Ex26 — concatMap with delay queue</h4><ex-26 /><hr />
      <h4>Ex27 — switchMap in search component</h4><ex-27 /><hr />
      <h4>Ex28 — mergeMap parallel operations</h4><ex-28 /><hr />
      <h4>Ex29 — concatMap upload queue</h4><ex-29 /><hr />
      <h4>Ex30 — exhaustMap form submit</h4><ex-30 /><hr />
      <h4>Ex31 — Typeahead (debounce+distinct+switchMap)</h4><ex-31 /><hr />
      <h4>Ex32 — concatMap processing one-by-one</h4><ex-32 /><hr />
      <h4>Ex33 — mergeMap concurrent results</h4><ex-33 /><hr />
      <h4>Ex34 — exhaustMap rapid-click demo</h4><ex-34 /><hr />
      <h4>Ex35 — Nested switchMap</h4><ex-35 /><hr />
      <h4>Ex36 — switchMap with error handling</h4><ex-36 /><hr />
      <h4>Ex37 — Full search pipeline</h4><ex-37 /><hr />
      <h4>Ex38 — Full autocomplete component</h4><ex-38 /><hr />
      <h4>Ex39 — groupBy + mergeMap</h4><ex-39 /><hr />
      <h4>Ex40 — buffer + map</h4><ex-40 /><hr />
      <h4>Ex41 — expand (recursive)</h4><ex-41 /><hr />
      <h4>Ex42 — mergeScan</h4><ex-42 /><hr />
      <h4>Ex43 — auditTime</h4><ex-43 /><hr />
      <h4>Ex44 — sampleTime</h4><ex-44 /><hr />
      <h4>Ex45 — throttle vs debounce</h4><ex-45 /><hr />
      <h4>Ex46 — Custom pipeable operator</h4><ex-46 /><hr />
      <h4>Ex47 — Operator composition</h4><ex-47 /><hr />
      <h4>Ex48 — Custom map with type safety</h4><ex-48 /><hr />
      <h4>Ex49 — Reusable pipeline</h4><ex-49 /><hr />
      <h4>Ex50 — Full pipeline operator chain</h4><ex-50 /><hr />
    </div>`,
})
export class AppComponent {}
