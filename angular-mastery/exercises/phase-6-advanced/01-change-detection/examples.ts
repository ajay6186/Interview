import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  ApplicationRef,
  NgZone,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  inject,
  Pipe,
  PipeTransform,
} from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { Observable, interval, Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

// ─── BASIC (1–13) ────────────────────────────────────────────────────────────

// Ex01 – Default Change Detection
@Component({
  selector: 'ex-01',
  standalone: true,
  template: `
    <p>Ex01 – Default CD: counter = {{ counter }}</p>
    <button (click)="inc()">Increment</button>
  `,
})
export class Ex01 {
  counter = 0;
  inc() { this.counter++; }
}

// Ex02 – OnPush Basic
@Component({
  selector: 'ex-02',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ex02 – OnPush basic: value = {{ value }}</p>`,
})
export class Ex02 {
  value = 42;
}

// Ex03 – markForCheck()
@Component({
  selector: 'ex-03',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ex03 – markForCheck: {{ label }}</p>`,
})
export class Ex03 implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  label = 'initial';

  ngOnInit() {
    setTimeout(() => {
      this.label = 'updated via markForCheck';
      this.cdr.markForCheck();
    }, 1000);
  }
}

// Ex04 – detectChanges()
@Component({
  selector: 'ex-04',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ex04 – detectChanges: {{ msg }}</p>`,
})
export class Ex04 implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  msg = 'initial';

  ngOnInit() {
    setTimeout(() => {
      this.msg = 'updated via detectChanges';
      this.cdr.detectChanges();
    }, 800);
  }
}

// Ex05 – OnPush with @Input change
@Component({
  selector: 'ex-05',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ex05 – OnPush @Input: {{ title }}</p>`,
})
export class Ex05 {
  @Input() title = 'default';
}

// Ex06 – OnPush with event
@Component({
  selector: 'ex-06',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p>Ex06 – OnPush + event: {{ count }}</p>
    <button (click)="count = count + 1">Click</button>
  `,
})
export class Ex06 {
  count = 0;
}

// Ex07 – OnPush with Observable async pipe
@Component({
  selector: 'ex-07',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe],
  template: `<p>Ex07 – OnPush async: {{ tick$ | async }}</p>`,
})
export class Ex07 {
  tick$ = interval(1000);
}

// Ex08 – OnPush with signal()
@Component({
  selector: 'ex-08',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ex08 – OnPush + signal: {{ count() }}</p><button (click)="count.set(count() + 1)">+</button>`,
})
export class Ex08 {
  count = signal(0);
}

// Ex09 – CD zone explanation (comment-driven example)
@Component({
  selector: 'ex-09',
  standalone: true,
  template: `
    <p>Ex09 – Zone.js triggers CD automatically on async events (setTimeout, XHR, Promises).</p>
    <!-- Zone.js patches browser APIs; Angular runs CD after each patched async op. -->
  `,
})
export class Ex09 {}

// Ex10 – ApplicationRef.tick()
@Component({
  selector: 'ex-10',
  standalone: true,
  template: `<p>Ex10 – ApplicationRef.tick(): {{ msg }}</p>`,
})
export class Ex10 implements OnInit {
  private appRef = inject(ApplicationRef);
  msg = 'before tick';

  ngOnInit() {
    setTimeout(() => {
      this.msg = 'after manual tick';
      this.appRef.tick();
    }, 500);
  }
}

// Ex11 – ChangeDetectorRef injection
@Component({
  selector: 'ex-11',
  standalone: true,
  template: `<p>Ex11 – CDRef injected: {{ injected }}</p>`,
})
export class Ex11 {
  private cdr = inject(ChangeDetectorRef);
  injected = !!this.cdr ? 'yes' : 'no';
}

// Ex12 – CD detach / reattach
@Component({
  selector: 'ex-12',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p>Ex12 – detach/reattach: {{ val }}</p>
    <button (click)="detach()">Detach</button>
    <button (click)="reattach()">Reattach</button>
  `,
})
export class Ex12 {
  private cdr = inject(ChangeDetectorRef);
  val = 'watching';

  detach() { this.cdr.detach(); this.val = 'detached (no CD)'; }
  reattach() { this.val = 'reattached'; this.cdr.reattach(); this.cdr.detectChanges(); }
}

// Ex13 – CD in lifecycle hooks
@Component({
  selector: 'ex-13',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ex13 – CD in lifecycle: {{ status }}</p>`,
})
export class Ex13 implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  status = 'created';

  ngOnInit() {
    this.status = 'initialized';
    this.cdr.markForCheck();
  }
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────────────────────

// Ex14 – OnPush + signal (no markForCheck needed)
@Component({
  selector: 'ex-14',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ex14 – signal auto-tracks: {{ name() }}</p><button (click)="name.set('Angular 17')">Set</button>`,
})
export class Ex14 {
  name = signal('default');
}

// Ex15 – OnPush immutable @Input pattern
@Component({
  selector: 'ex-15',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ex15 – Immutable @Input: {{ item.label }}</p>`,
})
export class Ex15 {
  @Input() item: { label: string } = { label: 'initial' };
  // Always pass a new object reference to trigger OnPush CD.
}

// Ex16 – OnPush with Output events
@Component({
  selector: 'ex-16',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button (click)="clicked.emit('ping')">Ex16 – Emit</button>`,
})
export class Ex16 {
  @Output() clicked = new EventEmitter<string>();
}

// Ex17 – OnPush timer-based update
@Component({
  selector: 'ex-17',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ex17 – Timer update: {{ ts }}</p>`,
})
export class Ex17 implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private zone = inject(NgZone);
  ts = Date.now();
  private id: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.zone.runOutsideAngular(() => {
      this.id = setInterval(() => {
        this.ts = Date.now();
        this.cdr.markForCheck();
      }, 2000);
    });
  }
  ngOnDestroy() { if (this.id) clearInterval(this.id); }
}

// Ex18 – OnPush HTTP async pipe
@Component({
  selector: 'ex-18',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe],
  template: `<p>Ex18 – OnPush async pipe: {{ data$ | async }}</p>`,
})
export class Ex18 {
  // In real usage inject HttpClient; using Observable.of for demo
  data$: Observable<string> = new Observable(obs => { obs.next('loaded'); obs.complete(); });
}

// Ex19 – OnPush form valueChanges
@Component({
  selector: 'ex-19',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ex19 – form valueChanges + markForCheck pattern (see code)</p>`,
})
export class Ex19 {
  // In a real component:
  // this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.cdr.markForCheck())
}

// Ex20 – Default vs OnPush comparison
@Component({
  selector: 'ex-20',
  standalone: true,
  template: `<p>Ex20 – Default CD: rerenders on every async event in zone.</p>`,
})
export class Ex20 {}

@Component({
  selector: 'ex-20-onpush',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ex20 – OnPush CD: rerenders only on @Input ref change, event, async pipe, signal, or markForCheck.</p>`,
})
export class Ex20OnPush {}

// Ex21 – CD optimization with trackBy
@Component({
  selector: 'ex-21',
  standalone: true,
  template: `
    <p>Ex21 – trackBy prevents DOM teardown on list re-render:</p>
    @for (item of items; track item.id) {
      <span>{{ item.label }}</span>
    }
  `,
})
export class Ex21 {
  items = [{ id: 1, label: 'A' }, { id: 2, label: 'B' }];
}

// Ex22 – ngZone.run()
@Component({
  selector: 'ex-22',
  standalone: true,
  template: `<p>Ex22 – ngZone.run(): {{ msg }}</p>`,
})
export class Ex22 implements OnInit {
  private zone = inject(NgZone);
  msg = 'outside zone';

  ngOnInit() {
    // Simulate work happening outside Angular zone
    Promise.resolve().then(() => {
      this.zone.run(() => { this.msg = 'back in zone'; });
    });
  }
}

// Ex23 – ngZone.runOutsideAngular()
@Component({
  selector: 'ex-23',
  standalone: true,
  template: `<p>Ex23 – runOutsideAngular prevents CD for heavy loops.</p>`,
})
export class Ex23 implements OnInit {
  private zone = inject(NgZone);

  ngOnInit() {
    this.zone.runOutsideAngular(() => {
      // Heavy computation — no CD triggered
      let sum = 0;
      for (let i = 0; i < 1_000_000; i++) sum += i;
    });
  }
}

// Ex24 – ApplicationRef.isStable
@Component({
  selector: 'ex-24',
  standalone: true,
  imports: [AsyncPipe],
  template: `<p>Ex24 – isStable: {{ stable$ | async }}</p>`,
})
export class Ex24 {
  private appRef = inject(ApplicationRef);
  stable$ = this.appRef.isStable;
}

// Ex25 – Zoneless CD concept
@Component({
  selector: 'ex-25',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ex25 – Zoneless: use provideExperimentalZonelessChangeDetection() + signals only. No zone.js needed.</p>`,
})
export class Ex25 {}

// Ex26 – CD with component hierarchy
@Component({
  selector: 'ex-26-leaf',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span>[leaf: {{ val }}]</span>`,
})
export class Ex26Leaf {
  @Input() val = '';
}

@Component({
  selector: 'ex-26',
  standalone: true,
  imports: [Ex26Leaf],
  template: `<p>Ex26 – hierarchy: <ex-26-leaf [val]="parentVal" /></p>`,
})
export class Ex26 {
  parentVal = 'passed down';
}

// ─── NESTED (27–38) ──────────────────────────────────────────────────────────

// Ex27 – Parent OnPush + Child OnPush
@Component({
  selector: 'ex-27-child',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span>child({{ val }})</span>`,
})
export class Ex27Child {
  @Input() val = '';
}

@Component({
  selector: 'ex-27',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Ex27Child],
  template: `<p>Ex27 – Parent+Child OnPush: <ex-27-child [val]="data" /></p>`,
})
export class Ex27 {
  data = 'immutable';
}

// Ex28 – OnPush chain with signal propagation
@Component({
  selector: 'ex-28-child',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span>{{ val() }}</span>`,
})
export class Ex28Child {
  val = signal('child-signal');
}

@Component({
  selector: 'ex-28',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Ex28Child],
  template: `<p>Ex28 – signal chain: <ex-28-child /></p>`,
})
export class Ex28 {}

// Ex29 – Granular CD — only leaf rerenders
@Component({
  selector: 'ex-29-leaf',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<em>leaf={{ count() }}</em>`,
})
export class Ex29Leaf {
  count = signal(0);
  inc() { this.count.update(v => v + 1); }
}

@Component({
  selector: 'ex-29',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Ex29Leaf],
  template: `
    <p>Ex29 – granular: only leaf rerenders on signal change.</p>
    <ex-29-leaf #leaf /><button (click)="leaf.inc()">+</button>
  `,
})
export class Ex29 {}

// Ex30 – CD with @ViewChild reference
@Component({
  selector: 'ex-30',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p #para>Ex30 – ViewChild: (check console)</p>`,
})
export class Ex30 {
  @ViewChild('para') para!: ElementRef<HTMLParagraphElement>;
}

// Ex31 – CD with dynamic components
@Component({
  selector: 'ex-31',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ex31 – dynamic components get their own CD context (see 03-dynamic-components).</p>`,
})
export class Ex31 {}

// Ex32 – Large list CD optimization
@Component({
  selector: 'ex-32',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p>Ex32 – large list with OnPush + trackBy:</p>
    @for (item of items; track item.id) {
      <span>{{ item.v }}</span>
    }
  `,
})
export class Ex32 {
  items = Array.from({ length: 20 }, (_, i) => ({ id: i, v: i * 2 }));
}

// Ex33 – CD with memoized selectors (signal computed)
@Component({
  selector: 'ex-33',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ex33 – computed signal memo: doubled = {{ doubled() }}</p>`,
})
export class Ex33 {
  base = signal(5);
  doubled = computed(() => this.base() * 2);
}

// Ex34 – CD and pure pipes
@Pipe({ name: 'double', standalone: true, pure: true })
export class DoublePipe implements PipeTransform {
  transform(v: number) { return v * 2; }
}

@Component({
  selector: 'ex-34',
  standalone: true,
  imports: [DoublePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ex34 – pure pipe: {{ 7 | double }}</p>`,
})
export class Ex34 {}

// Ex35 – CD tree walk visualization (comment-driven)
@Component({
  selector: 'ex-35',
  standalone: true,
  template: `
    <p>Ex35 – Angular CD walks tree top-down. OnPush skips subtrees unless dirty. Signals mark only affected nodes dirty.</p>
  `,
})
export class Ex35 {}

// Ex36 – OnPush + markForCheck in child
@Component({
  selector: 'ex-36-child',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span>{{ label }}</span>`,
})
export class Ex36Child implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  label = 'pending';

  ngOnInit() {
    setTimeout(() => { this.label = 'ready'; this.cdr.markForCheck(); }, 600);
  }
}

@Component({
  selector: 'ex-36',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Ex36Child],
  template: `<p>Ex36 – child markForCheck: <ex-36-child /></p>`,
})
export class Ex36 {}

// Ex37 – CD debugging with OnPush
@Component({
  selector: 'ex-37',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ex37 – Debug OnPush: use Angular DevTools "Component tree" to inspect dirty flags.</p>`,
})
export class Ex37 {}

// Ex38 – CD performance profiling tips
@Component({
  selector: 'ex-38',
  standalone: true,
  template: `<p>Ex38 – Profiling: Angular DevTools Profiler tab shows CD cycles, component check time, and skipped trees.</p>`,
})
export class Ex38 {}

// ─── ADVANCED (39–50) ────────────────────────────────────────────────────────

// Ex39 – provideExperimentalZonelessChangeDetection
@Component({
  selector: 'ex-39',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ex39 – Zoneless: add provideExperimentalZonelessChangeDetection() to bootstrapApplication providers. Remove zone.js from polyfills.</p>`,
})
export class Ex39 {}

// Ex40 – Zoneless with signals
@Component({
  selector: 'ex-40',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ex40 – Zoneless + signal: {{ counter() }}</p><button (click)="counter.update(v => v+1)">+</button>`,
})
export class Ex40 {
  counter = signal(0);
}

// Ex41 – Signal-based CD replacement
@Component({
  selector: 'ex-41',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ex41 – signals replace manual CD: computed + signal drive template reactivity without zone.js.</p>`,
})
export class Ex41 {
  a = signal(2);
  b = signal(3);
  sum = computed(() => this.a() + this.b());
}

// Ex42 – Zoneless event handling
@Component({
  selector: 'ex-42',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ex42 – Zoneless events: Angular 17+ uses event coalescing + signals; no zone patch needed for (click).</p>`,
})
export class Ex42 {}

// Ex43 – CD with Web Workers
@Component({
  selector: 'ex-43',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ex43 – Web Worker result: {{ result() }}</p>`,
})
export class Ex43 {
  private cdr = inject(ChangeDetectorRef);
  result = signal<number | null>(null);

  runWorker() {
    // Workers run off the main thread; post result back and update signal
    // const worker = new Worker(new URL('./my.worker', import.meta.url));
    // worker.onmessage = ({ data }) => { this.result.set(data); };
  }
}

// Ex44 – CD with requestAnimationFrame
@Component({
  selector: 'ex-44',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ex44 – rAF outside zone: {{ frame() }}</p>`,
})
export class Ex44 implements OnInit, OnDestroy {
  private zone = inject(NgZone);
  frame = signal(0);
  private rafId = 0;

  ngOnInit() {
    this.zone.runOutsideAngular(() => {
      const loop = () => {
        this.frame.update(v => v + 1);
        this.rafId = requestAnimationFrame(loop);
      };
      this.rafId = requestAnimationFrame(loop);
    });
  }
  ngOnDestroy() { cancelAnimationFrame(this.rafId); }
}

// Ex45 – CD with IntersectionObserver
@Component({
  selector: 'ex-45',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p #target>Ex45 – IntersectionObserver: visible={{ visible() }}</p>`,
})
export class Ex45 implements OnInit, OnDestroy {
  @ViewChild('target', { static: true }) target!: ElementRef;
  private zone = inject(NgZone);
  visible = signal(false);
  private observer!: IntersectionObserver;

  ngOnInit() {
    this.zone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver(([entry]) => {
        this.visible.set(entry.isIntersecting);
      });
      this.observer.observe(this.target.nativeElement);
    });
  }
  ngOnDestroy() { this.observer.disconnect(); }
}

// Ex46 – CD with ResizeObserver
@Component({
  selector: 'ex-46',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #box style="resize:both;overflow:auto;border:1px solid #ccc;width:100px">Ex46 – resize: {{ width() }}px</div>`,
})
export class Ex46 implements OnInit, OnDestroy {
  @ViewChild('box', { static: true }) box!: ElementRef;
  private zone = inject(NgZone);
  width = signal(100);
  private ro!: ResizeObserver;

  ngOnInit() {
    this.zone.runOutsideAngular(() => {
      this.ro = new ResizeObserver(([entry]) => {
        this.width.set(Math.round(entry.contentRect.width));
      });
      this.ro.observe(this.box.nativeElement);
    });
  }
  ngOnDestroy() { this.ro.disconnect(); }
}

// Ex47 – CD with MutationObserver
@Component({
  selector: 'ex-47',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #watch>Ex47 – MutationObserver: mutations={{ count() }}</div>`,
})
export class Ex47 implements OnInit, OnDestroy {
  @ViewChild('watch', { static: true }) watch!: ElementRef;
  private zone = inject(NgZone);
  count = signal(0);
  private mo!: MutationObserver;

  ngOnInit() {
    this.zone.runOutsideAngular(() => {
      this.mo = new MutationObserver(() => { this.count.update(v => v + 1); });
      this.mo.observe(this.watch.nativeElement, { childList: true, subtree: true });
    });
  }
  ngOnDestroy() { this.mo.disconnect(); }
}

// Ex48 – OnPush + RxJS + async pipe chain
@Component({
  selector: 'ex-48',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe],
  template: `<p>Ex48 – RxJS async pipe: {{ ticks$ | async }}</p>`,
})
export class Ex48 {
  ticks$ = interval(1000).pipe(map(n => `tick ${n}`));
}

// Ex49 – CD coalescing
@Component({
  selector: 'ex-49',
  standalone: true,
  template: `<p>Ex49 – CD coalescing: enable via provideZoneChangeDetection(&#123; eventCoalescing: true &#125;) to batch multiple events into one CD cycle.</p>`,
})
export class Ex49 {}

// Ex50 – Full OnPush app pattern
@Component({
  selector: 'ex-50',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p>Ex50 – Full OnPush pattern: all components OnPush, data via signals/async pipe, no direct DOM mutation, effects for side-effects.</p>
    <p>count={{ n() }}</p>
    <button (click)="n.update(v => v+1)">+</button>
  `,
})
export class Ex50 {
  n = signal(0);
}

// ─── AppComponent ─────────────────────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    Ex01, Ex02, Ex03, Ex04, Ex05, Ex06, Ex07, Ex08, Ex09, Ex10,
    Ex11, Ex12, Ex13, Ex14, Ex15, Ex16, Ex17, Ex18, Ex19, Ex20,
    Ex20OnPush, Ex21, Ex22, Ex23, Ex24, Ex25, Ex26, Ex27, Ex28,
    Ex29, Ex30, Ex31, Ex32, Ex33, Ex34, Ex35, Ex36, Ex37, Ex38,
    Ex39, Ex40, Ex41, Ex42, Ex43, Ex44, Ex45, Ex46, Ex47, Ex48,
    Ex49, Ex50,
  ],
  template: `
    <h2>Phase 6 – Change Detection</h2>

    <h4>Ex01 – Default Change Detection</h4><ex-01 /><hr />
    <h4>Ex02 – OnPush Basic</h4><ex-02 /><hr />
    <h4>Ex03 – markForCheck()</h4><ex-03 /><hr />
    <h4>Ex04 – detectChanges()</h4><ex-04 /><hr />
    <h4>Ex05 – OnPush with @Input change</h4><ex-05 [title]="'passed in'" /><hr />
    <h4>Ex06 – OnPush with event</h4><ex-06 /><hr />
    <h4>Ex07 – OnPush with Observable async</h4><ex-07 /><hr />
    <h4>Ex08 – OnPush with signal</h4><ex-08 /><hr />
    <h4>Ex09 – CD zone explanation</h4><ex-09 /><hr />
    <h4>Ex10 – ApplicationRef.tick()</h4><ex-10 /><hr />
    <h4>Ex11 – ChangeDetectorRef injection</h4><ex-11 /><hr />
    <h4>Ex12 – CD detach/reattach</h4><ex-12 /><hr />
    <h4>Ex13 – CD in lifecycle hooks</h4><ex-13 /><hr />
    <h4>Ex14 – OnPush + signal (no markForCheck)</h4><ex-14 /><hr />
    <h4>Ex15 – OnPush immutable @Input pattern</h4><ex-15 /><hr />
    <h4>Ex16 – OnPush with Output events</h4><ex-16 /><hr />
    <h4>Ex17 – OnPush timer-based update</h4><ex-17 /><hr />
    <h4>Ex18 – OnPush HTTP async pipe</h4><ex-18 /><hr />
    <h4>Ex19 – OnPush form valueChanges</h4><ex-19 /><hr />
    <h4>Ex20 – Default vs OnPush comparison</h4><ex-20 /><ex-20-onpush /><hr />
    <h4>Ex21 – CD optimization with trackBy</h4><ex-21 /><hr />
    <h4>Ex22 – ngZone.run()</h4><ex-22 /><hr />
    <h4>Ex23 – ngZone.runOutsideAngular()</h4><ex-23 /><hr />
    <h4>Ex24 – ApplicationRef.isStable</h4><ex-24 /><hr />
    <h4>Ex25 – Zoneless CD concept</h4><ex-25 /><hr />
    <h4>Ex26 – CD with component hierarchy</h4><ex-26 /><hr />
    <h4>Ex27 – Parent OnPush + Child OnPush</h4><ex-27 /><hr />
    <h4>Ex28 – OnPush chain with signal propagation</h4><ex-28 /><hr />
    <h4>Ex29 – Granular CD — only leaf rerenders</h4><ex-29 /><hr />
    <h4>Ex30 – CD with @ViewChild reference</h4><ex-30 /><hr />
    <h4>Ex31 – CD with dynamic components</h4><ex-31 /><hr />
    <h4>Ex32 – Large list CD optimization</h4><ex-32 /><hr />
    <h4>Ex33 – CD with memoized selectors (computed)</h4><ex-33 /><hr />
    <h4>Ex34 – CD and pure pipes</h4><ex-34 /><hr />
    <h4>Ex35 – CD tree walk visualization</h4><ex-35 /><hr />
    <h4>Ex36 – OnPush + markForCheck in child</h4><ex-36 /><hr />
    <h4>Ex37 – CD debugging with OnPush</h4><ex-37 /><hr />
    <h4>Ex38 – CD performance profiling tips</h4><ex-38 /><hr />
    <h4>Ex39 – provideExperimentalZonelessChangeDetection</h4><ex-39 /><hr />
    <h4>Ex40 – Zoneless with signals</h4><ex-40 /><hr />
    <h4>Ex41 – Signal-based CD replacement</h4><ex-41 /><hr />
    <h4>Ex42 – Zoneless event handling</h4><ex-42 /><hr />
    <h4>Ex43 – CD with Web Workers</h4><ex-43 /><hr />
    <h4>Ex44 – CD with requestAnimationFrame</h4><ex-44 /><hr />
    <h4>Ex45 – CD with IntersectionObserver</h4><ex-45 /><hr />
    <h4>Ex46 – CD with ResizeObserver</h4><ex-46 /><hr />
    <h4>Ex47 – CD with MutationObserver</h4><ex-47 /><hr />
    <h4>Ex48 – OnPush + RxJS + async pipe chain</h4><ex-48 /><hr />
    <h4>Ex49 – CD coalescing</h4><ex-49 /><hr />
    <h4>Ex50 – Full OnPush app pattern</h4><ex-50 /><hr />
  `,
})
export class AppComponent {}
