import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  AfterViewInit,
  AfterContentInit,
  AfterViewChecked,
  AfterContentChecked,
  DoCheck,
  SimpleChanges,
  ViewChild,
  ContentChild,
  ViewChildren,
  QueryList,
  ElementRef,
  inject,
  signal,
  effect,
  afterRender,
  afterNextRender,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// ─── BASIC (1–13) ────────────────────────────────────────────────────────────

// Ex01 – ngOnInit basics
@Component({
  selector: 'ex-01',
  standalone: true,
  template: `<p>Ex01 – ngOnInit: {{ msg }}</p>`,
})
export class Ex01 implements OnInit {
  msg = '';
  ngOnInit() { this.msg = 'ngOnInit ran'; }
}

// Ex02 – ngOnDestroy basics
@Component({
  selector: 'ex-02',
  standalone: true,
  template: `<p>Ex02 – ngOnDestroy: check console on removal</p>`,
})
export class Ex02 implements OnDestroy {
  ngOnDestroy() { console.log('Ex02 destroyed'); }
}

// Ex03 – ngOnChanges basics
@Component({
  selector: 'ex-03',
  standalone: true,
  template: `<p>Ex03 – ngOnChanges: val={{ val }}</p>`,
})
export class Ex03 implements OnChanges {
  @Input() val = 0;
  ngOnChanges(changes: SimpleChanges) {
    console.log('Ex03 ngOnChanges', changes);
  }
}

// Ex04 – ngAfterViewInit basics
@Component({
  selector: 'ex-04',
  standalone: true,
  template: `<p #el>Ex04 – ngAfterViewInit: view ready</p>`,
})
export class Ex04 implements AfterViewInit {
  @ViewChild('el') el!: ElementRef;
  ngAfterViewInit() { console.log('Ex04 view ready', this.el.nativeElement.tagName); }
}

// Ex05 – ngAfterContentInit basics
@Component({
  selector: 'ex-05',
  standalone: true,
  template: `<p>Ex05 – ngAfterContentInit: content projected</p><ng-content />`,
})
export class Ex05 implements AfterContentInit {
  ngAfterContentInit() { console.log('Ex05 content init'); }
}

// Ex06 – ngAfterViewChecked basics
@Component({
  selector: 'ex-06',
  standalone: true,
  template: `<p>Ex06 – ngAfterViewChecked runs after every CD cycle</p>`,
})
export class Ex06 implements AfterViewChecked {
  ngAfterViewChecked() { /* runs frequently — avoid heavy work here */ }
}

// Ex07 – ngAfterContentChecked basics
@Component({
  selector: 'ex-07',
  standalone: true,
  template: `<p>Ex07 – ngAfterContentChecked: runs after content CD</p><ng-content />`,
})
export class Ex07 implements AfterContentChecked {
  ngAfterContentChecked() { /* runs after every content check */ }
}

// Ex08 – ngDoCheck basics
@Component({
  selector: 'ex-08',
  standalone: true,
  template: `<p>Ex08 – ngDoCheck: custom dirty check (see console)</p>`,
})
export class Ex08 implements DoCheck {
  private prev = '';
  items: string[] = [];
  ngDoCheck() {
    const cur = JSON.stringify(this.items);
    if (cur !== this.prev) { this.prev = cur; console.log('Ex08 items changed'); }
  }
}

// Ex09 – Constructor vs ngOnInit
@Component({
  selector: 'ex-09',
  standalone: true,
  template: `<p>Ex09 – Constructor: DI only. ngOnInit: first data fetch / setup.</p>`,
})
export class Ex09 {
  constructor() { /* inject services here */ }
  ngOnInit() { /* use injected services here */ }
}

// Ex10 – Init order: parent vs child
@Component({
  selector: 'ex-10-child',
  standalone: true,
  template: `<span>(child)</span>`,
})
export class Ex10Child implements OnInit {
  ngOnInit() { console.log('Ex10 child ngOnInit'); }
}

@Component({
  selector: 'ex-10',
  standalone: true,
  imports: [Ex10Child],
  template: `<p>Ex10 – order: parent ctor → child ctor → child ngOnInit → parent ngOnInit</p><ex-10-child />`,
})
export class Ex10 implements OnInit {
  ngOnInit() { console.log('Ex10 parent ngOnInit'); }
}

// Ex11 – OnPush + lifecycle
@Component({
  selector: 'ex-11',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ex11 – OnPush lifecycle: hooks still fire normally; CD is just skipped unless marked dirty.</p>`,
})
export class Ex11 implements OnInit {
  ngOnInit() { console.log('Ex11 OnPush ngOnInit'); }
}

// Ex12 – Interface implementation
@Component({
  selector: 'ex-12',
  standalone: true,
  template: `<p>Ex12 – Always implement lifecycle interfaces (OnInit, etc.) for type safety.</p>`,
})
export class Ex12 implements OnInit, OnDestroy {
  ngOnInit() {}
  ngOnDestroy() {}
}

// Ex13 – (slot 13 — extra OnInit pattern: field initializer vs ngOnInit)
@Component({
  selector: 'ex-13',
  standalone: true,
  template: `<p>Ex13 – Field initializer runs in constructor; ngOnInit runs after inputs are set. Prefer ngOnInit for input-dependent logic.</p>`,
})
export class Ex13 {
  @Input() id = '';
  // ngOnInit can safely read this.id; field initializer cannot.
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────────────────────

// Ex14 – ngOnChanges SimpleChanges detail
@Component({
  selector: 'ex-14',
  standalone: true,
  template: `<p>Ex14 – SimpleChanges: {{ detail }}</p>`,
})
export class Ex14 implements OnChanges {
  @Input() data = '';
  detail = '';
  ngOnChanges(changes: SimpleChanges) {
    const c = changes['data'];
    if (c) this.detail = `prev=${c.previousValue} cur=${c.currentValue}`;
  }
}

// Ex15 – ngOnChanges previousValue vs currentValue
@Component({
  selector: 'ex-15',
  standalone: true,
  template: `<p>Ex15 – prev: {{ prev }}, cur: {{ cur }}</p>`,
})
export class Ex15 implements OnChanges {
  @Input() count = 0;
  prev: number | undefined;
  cur = 0;
  ngOnChanges(changes: SimpleChanges) {
    const c = changes['count'];
    if (c) { this.prev = c.previousValue; this.cur = c.currentValue; }
  }
}

// Ex16 – ngOnChanges firstChange
@Component({
  selector: 'ex-16',
  standalone: true,
  template: `<p>Ex16 – firstChange: {{ first }}</p>`,
})
export class Ex16 implements OnChanges {
  @Input() val = '';
  first = false;
  ngOnChanges(changes: SimpleChanges) {
    const c = changes['val'];
    if (c) this.first = c.firstChange;
  }
}

// Ex17 – ngAfterViewInit @ViewChild focus
@Component({
  selector: 'ex-17',
  standalone: true,
  template: `<input #inp placeholder="Ex17 – auto-focused" />`,
})
export class Ex17 implements AfterViewInit {
  @ViewChild('inp') inp!: ElementRef<HTMLInputElement>;
  ngAfterViewInit() { this.inp.nativeElement.focus(); }
}

// Ex18 – ngAfterContentInit @ContentChild access
@Component({
  selector: 'ex-18',
  standalone: true,
  template: `<p>Ex18 – ContentChild: <ng-content /></p>`,
})
export class Ex18 implements AfterContentInit {
  @ContentChild('slot') slot!: ElementRef;
  ngAfterContentInit() { console.log('Ex18 content child', this.slot); }
}

// Ex19 – ngDoCheck custom change detection
@Component({
  selector: 'ex-19',
  standalone: true,
  template: `<p>Ex19 – ngDoCheck custom: changed={{ changed }}</p>`,
})
export class Ex19 implements DoCheck {
  arr = [1, 2, 3];
  private snap = JSON.stringify([1, 2, 3]);
  changed = false;
  ngDoCheck() {
    const now = JSON.stringify(this.arr);
    this.changed = now !== this.snap;
    if (this.changed) this.snap = now;
  }
}

// Ex20 – ngOnDestroy subscription cleanup
@Component({
  selector: 'ex-20',
  standalone: true,
  template: `<p>Ex20 – destroy$ cleanup: {{ tick }}</p>`,
})
export class Ex20 implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  tick = 0;
  ngOnInit() {
    interval(1000).pipe(takeUntil(this.destroy$)).subscribe(n => this.tick = n);
  }
  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
}

// Ex21 – ngOnDestroy timer cleanup
@Component({
  selector: 'ex-21',
  standalone: true,
  template: `<p>Ex21 – timer cleanup</p>`,
})
export class Ex21 implements OnInit, OnDestroy {
  private id!: ReturnType<typeof setInterval>;
  ngOnInit() { this.id = setInterval(() => {}, 1000); }
  ngOnDestroy() { clearInterval(this.id); }
}

// Ex22 – ngOnDestroy event listener cleanup
@Component({
  selector: 'ex-22',
  standalone: true,
  template: `<p>Ex22 – event listener cleanup</p>`,
})
export class Ex22 implements OnInit, OnDestroy {
  private handler = () => console.log('resize');
  ngOnInit() { window.addEventListener('resize', this.handler); }
  ngOnDestroy() { window.removeEventListener('resize', this.handler); }
}

// Ex23 – takeUntilDestroyed alternative
@Component({
  selector: 'ex-23',
  standalone: true,
  template: `<p>Ex23 – takeUntilDestroyed: {{ tick }}</p>`,
})
export class Ex23 implements OnInit {
  tick = 0;
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    interval(1000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(n => this.tick = n);
  }
}

// Ex24 – DestroyRef.onDestroy()
@Component({
  selector: 'ex-24',
  standalone: true,
  template: `<p>Ex24 – DestroyRef.onDestroy callback</p>`,
})
export class Ex24 {
  constructor() {
    inject(DestroyRef).onDestroy(() => console.log('Ex24 destroyed via DestroyRef'));
  }
}

// Ex25 – afterRender()
@Component({
  selector: 'ex-25',
  standalone: true,
  template: `<p>Ex25 – afterRender: runs after every render</p>`,
})
export class Ex25 {
  constructor() {
    afterRender(() => { /* DOM measurements here — safe after render */ });
  }
}

// Ex26 – afterNextRender()
@Component({
  selector: 'ex-26',
  standalone: true,
  template: `<p>Ex26 – afterNextRender: runs once after next render</p>`,
})
export class Ex26 {
  constructor() {
    afterNextRender(() => { console.log('Ex26 first render complete'); });
  }
}

// ─── NESTED (27–38) ──────────────────────────────────────────────────────────

// Ex27 – Parent-child lifecycle order log
@Component({
  selector: 'ex-27-child',
  standalone: true,
  template: `<span>[child]</span>`,
})
export class Ex27Child implements OnInit, OnDestroy {
  ngOnInit() { console.log('Ex27 child init'); }
  ngOnDestroy() { console.log('Ex27 child destroy'); }
}

@Component({
  selector: 'ex-27',
  standalone: true,
  imports: [Ex27Child],
  template: `<p>Ex27 – parent/child order: <ex-27-child /></p>`,
})
export class Ex27 implements OnInit, AfterViewInit {
  ngOnInit() { console.log('Ex27 parent init'); }
  ngAfterViewInit() { console.log('Ex27 parent afterViewInit'); }
}

// Ex28 – Grandchild lifecycle
@Component({
  selector: 'ex-28-grand',
  standalone: true,
  template: `<em>[grand]</em>`,
})
export class Ex28Grand implements OnInit {
  ngOnInit() { console.log('Ex28 grandchild init'); }
}

@Component({
  selector: 'ex-28-mid',
  standalone: true,
  imports: [Ex28Grand],
  template: `<ex-28-grand />`,
})
export class Ex28Mid implements OnInit {
  ngOnInit() { console.log('Ex28 mid init'); }
}

@Component({
  selector: 'ex-28',
  standalone: true,
  imports: [Ex28Mid],
  template: `<p>Ex28 – grandchild: <ex-28-mid /></p>`,
})
export class Ex28 implements OnInit {
  ngOnInit() { console.log('Ex28 root init'); }
}

// Ex29 – Content projection lifecycle (ngAfterContentInit)
@Component({
  selector: 'ex-29-wrapper',
  standalone: true,
  template: `<div><ng-content /></div>`,
})
export class Ex29Wrapper implements AfterContentInit {
  @ContentChild('projected') proj!: ElementRef;
  ngAfterContentInit() { console.log('Ex29 content ready', this.proj); }
}

@Component({
  selector: 'ex-29',
  standalone: true,
  imports: [Ex29Wrapper],
  template: `<ex-29-wrapper><span #projected>Ex29 – content projected</span></ex-29-wrapper>`,
})
export class Ex29 {}

// Ex30 – @ViewChildren lifecycle
@Component({
  selector: 'ex-30-item',
  standalone: true,
  template: `<li>item</li>`,
})
export class Ex30Item {}

@Component({
  selector: 'ex-30',
  standalone: true,
  imports: [Ex30Item],
  template: `<p>Ex30 – ViewChildren:</p><ex-30-item /><ex-30-item /><ex-30-item />`,
})
export class Ex30 implements AfterViewInit {
  @ViewChildren(Ex30Item) items!: QueryList<Ex30Item>;
  ngAfterViewInit() { console.log('Ex30 items count', this.items.length); }
}

// Ex31 – Dynamic component lifecycle
@Component({
  selector: 'ex-31',
  standalone: true,
  template: `<p>Ex31 – Dynamic component (createComponent) goes through full lifecycle: constructor → ngOnInit → ngAfterViewInit → ngOnDestroy on destroy.</p>`,
})
export class Ex31 {}

// Ex32 – Route change lifecycle
@Component({
  selector: 'ex-32',
  standalone: true,
  template: `<p>Ex32 – On route navigation: new component ngOnInit, old component ngOnDestroy. Use ngOnDestroy for cleanup.</p>`,
})
export class Ex32 {}

// Ex33 – Service lifecycle (APP_INITIALIZER)
@Component({
  selector: 'ex-33',
  standalone: true,
  template: `<p>Ex33 – APP_INITIALIZER: provide(APP_INITIALIZER, &#123; useFactory: ... &#125;) runs before app starts. Use for auth, config load.</p>`,
})
export class Ex33 {}

// Ex34 – Lifecycle with HTTP cleanup
@Component({
  selector: 'ex-34',
  standalone: true,
  template: `<p>Ex34 – HTTP cleanup: unsubscribe on destroy or use takeUntilDestroyed to cancel in-flight requests.</p>`,
})
export class Ex34 implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  ngOnInit() {
    // httpClient.get('/api/data').pipe(takeUntil(this.destroy$)).subscribe(...)
  }
  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
}

// Ex35 – Lifecycle with WebSocket
@Component({
  selector: 'ex-35',
  standalone: true,
  template: `<p>Ex35 – WebSocket: open in ngOnInit, close in ngOnDestroy.</p>`,
})
export class Ex35 implements OnInit, OnDestroy {
  private ws!: WebSocket;
  ngOnInit() { /* this.ws = new WebSocket('wss://...'); */ }
  ngOnDestroy() { /* this.ws?.close(); */ }
}

// Ex36 – Lifecycle with timer
@Component({
  selector: 'ex-36',
  standalone: true,
  template: `<p>Ex36 – timer lifecycle: {{ ts }}</p>`,
})
export class Ex36 implements OnInit, OnDestroy {
  ts = '';
  private id!: ReturnType<typeof setInterval>;
  ngOnInit() { this.id = setInterval(() => { this.ts = new Date().toISOString(); }, 1000); }
  ngOnDestroy() { clearInterval(this.id); }
}

// Ex37 – Lifecycle with animation
@Component({
  selector: 'ex-37',
  standalone: true,
  template: `<p>Ex37 – Animate in ngAfterViewInit (element available), cancel in ngOnDestroy.</p>`,
})
export class Ex37 implements AfterViewInit, OnDestroy {
  private rafId = 0;
  ngAfterViewInit() { this.rafId = requestAnimationFrame(() => {}); }
  ngOnDestroy() { cancelAnimationFrame(this.rafId); }
}

// Ex38 – Full component lifecycle timeline
@Component({
  selector: 'ex-38',
  standalone: true,
  template: `<p>Ex38 – Full timeline: constructor → ngOnChanges → ngOnInit → ngDoCheck → ngAfterContentInit → ngAfterContentChecked → ngAfterViewInit → ngAfterViewChecked → (repeat: ngDoCheck → checked) → ngOnDestroy</p>`,
})
export class Ex38 implements OnInit, OnChanges, DoCheck, AfterContentInit, AfterContentChecked, AfterViewInit, AfterViewChecked, OnDestroy {
  @Input() x = 0;
  ngOnChanges() {}
  ngOnInit() {}
  ngDoCheck() {}
  ngAfterContentInit() {}
  ngAfterContentChecked() {}
  ngAfterViewInit() {}
  ngAfterViewChecked() {}
  ngOnDestroy() {}
}

// ─── ADVANCED (39–50) ────────────────────────────────────────────────────────

// Ex39 – Lifecycle with signals (effect vs ngOnInit)
@Component({
  selector: 'ex-39',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ex39 – effect() replaces ngOnChanges for signals. Runs reactively when signals change.</p><p>{{ doubled() }}</p>`,
})
export class Ex39 {
  base = signal(3);
  doubled = signal(6);

  constructor() {
    effect(() => { this.doubled.set(this.base() * 2); });
  }
}

// Ex40 – afterRender scheduling
@Component({
  selector: 'ex-40',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #c width="100" height="40"></canvas><p>Ex40 – afterRender for canvas draw</p>`,
})
export class Ex40 {
  @ViewChild('c', { static: true }) c!: ElementRef<HTMLCanvasElement>;

  constructor() {
    afterRender(() => {
      const ctx = this.c?.nativeElement.getContext('2d');
      if (ctx) { ctx.fillStyle = '#4CAF50'; ctx.fillRect(0, 0, 100, 40); }
    });
  }
}

// Ex41 – afterNextRender for measurement
@Component({
  selector: 'ex-41',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #box style="padding:8px">Ex41 – measure after render: {{ width() }}px</div>`,
})
export class Ex41 {
  @ViewChild('box', { static: true }) box!: ElementRef;
  width = signal(0);

  constructor() {
    afterNextRender(() => { this.width.set(this.box.nativeElement.offsetWidth); });
  }
}

// Ex42 – Lifecycle hook replacement with signals
@Component({
  selector: 'ex-42',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ex42 – Signals + effect replace ngOnChanges: {{ status() }}</p>`,
})
export class Ex42 {
  data = signal('initial');
  status = signal('');
  constructor() { effect(() => { this.status.set(`data changed: ${this.data()}`); }); }
}

// Ex43 – inject() in field initializer (vs constructor)
@Component({
  selector: 'ex-43',
  standalone: true,
  template: `<p>Ex43 – inject() in field: {{ cdrAvailable }}</p>`,
})
export class Ex43 {
  // inject() works outside constructor when called during construction
  private cdr = inject(ChangeDetectorRef);
  cdrAvailable = !!this.cdr;
}

// Ex44 – Lifecycle with performance measurement
@Component({
  selector: 'ex-44',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ex44 – perf measurement: initTime={{ initMs() }}ms</p>`,
})
export class Ex44 implements OnInit {
  private t0 = performance.now();
  initMs = signal(0);
  ngOnInit() { this.initMs.set(+(performance.now() - this.t0).toFixed(2)); }
}

// Ex45 – Lifecycle with SSR
@Component({
  selector: 'ex-45',
  standalone: true,
  template: `<p>Ex45 – SSR: ngOnInit runs on server; ngAfterViewInit does NOT. Avoid DOM access in ngOnInit for SSR safety.</p>`,
})
export class Ex45 {}

// Ex46 – Lifecycle with zone.js disabled
@Component({
  selector: 'ex-46',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ex46 – Zoneless: lifecycle hooks work identically; only CD triggering changes (signals required).</p>`,
})
export class Ex46 implements OnInit {
  ngOnInit() { console.log('Ex46 zoneless ngOnInit'); }
}

// Ex47 – Input signal changes (no ngOnChanges)
@Component({
  selector: 'ex-47',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ex47 – input() signal: no ngOnChanges needed. Use effect() to react.</p>`,
})
export class Ex47 {
  // In Angular 17.1+: title = input<string>('default');
  // effect(() => { console.log('title changed', this.title()); });
}

// Ex48 – Lifecycle testing patterns
@Component({
  selector: 'ex-48',
  standalone: true,
  template: `<p>Ex48 – Testing lifecycle: call ngOnInit() directly in TestBed; fixture.destroy() triggers ngOnDestroy.</p>`,
})
export class Ex48 {}

// Ex49 – Lifecycle with ComponentRef (dynamic)
@Component({
  selector: 'ex-49',
  standalone: true,
  template: `<p>Ex49 – Dynamic ComponentRef: componentRef.destroy() triggers ngOnDestroy. componentRef.changeDetectorRef.detectChanges() for manual CD.</p>`,
})
export class Ex49 {}

// Ex50 – Full lifecycle-optimized component
@Component({
  selector: 'ex-50',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Ex50 – Optimized: signal inputs, effect for side-effects, takeUntilDestroyed for RxJS, afterNextRender for DOM. count={{ count() }}</p>`,
})
export class Ex50 implements OnInit {
  count = signal(0);
  private destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => { console.log('Ex50 first render'); });
  }

  ngOnInit() {
    interval(2000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.count.update(v => v + 1);
    });
  }
}

// ─── AppComponent ─────────────────────────────────────────────────────────────

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
    <h2>Phase 6 – Lifecycle Hooks</h2>

    <h4>Ex01 – ngOnInit basics</h4><ex-01 /><hr />
    <h4>Ex02 – ngOnDestroy basics</h4><ex-02 /><hr />
    <h4>Ex03 – ngOnChanges basics</h4><ex-03 [val]="5" /><hr />
    <h4>Ex04 – ngAfterViewInit basics</h4><ex-04 /><hr />
    <h4>Ex05 – ngAfterContentInit basics</h4><ex-05>content</ex-05><hr />
    <h4>Ex06 – ngAfterViewChecked basics</h4><ex-06 /><hr />
    <h4>Ex07 – ngAfterContentChecked basics</h4><ex-07>projected</ex-07><hr />
    <h4>Ex08 – ngDoCheck basics</h4><ex-08 /><hr />
    <h4>Ex09 – Constructor vs ngOnInit</h4><ex-09 /><hr />
    <h4>Ex10 – Init order (parent vs child)</h4><ex-10 /><hr />
    <h4>Ex11 – OnPush + lifecycle</h4><ex-11 /><hr />
    <h4>Ex12 – Interface implementation</h4><ex-12 /><hr />
    <h4>Ex13 – Field initializer vs ngOnInit</h4><ex-13 id="abc" /><hr />
    <h4>Ex14 – ngOnChanges SimpleChanges detail</h4><ex-14 data="hello" /><hr />
    <h4>Ex15 – previousValue vs currentValue</h4><ex-15 [count]="7" /><hr />
    <h4>Ex16 – ngOnChanges firstChange</h4><ex-16 val="first" /><hr />
    <h4>Ex17 – ngAfterViewInit @ViewChild focus</h4><ex-17 /><hr />
    <h4>Ex18 – ngAfterContentInit @ContentChild</h4><ex-18><span #slot>slot</span></ex-18><hr />
    <h4>Ex19 – ngDoCheck custom detection</h4><ex-19 /><hr />
    <h4>Ex20 – ngOnDestroy subscription cleanup</h4><ex-20 /><hr />
    <h4>Ex21 – ngOnDestroy timer cleanup</h4><ex-21 /><hr />
    <h4>Ex22 – ngOnDestroy event listener cleanup</h4><ex-22 /><hr />
    <h4>Ex23 – takeUntilDestroyed</h4><ex-23 /><hr />
    <h4>Ex24 – DestroyRef.onDestroy()</h4><ex-24 /><hr />
    <h4>Ex25 – afterRender()</h4><ex-25 /><hr />
    <h4>Ex26 – afterNextRender()</h4><ex-26 /><hr />
    <h4>Ex27 – Parent-child lifecycle order</h4><ex-27 /><hr />
    <h4>Ex28 – Grandchild lifecycle</h4><ex-28 /><hr />
    <h4>Ex29 – Content projection lifecycle</h4><ex-29 /><hr />
    <h4>Ex30 – @ViewChildren lifecycle</h4><ex-30 /><hr />
    <h4>Ex31 – Dynamic component lifecycle</h4><ex-31 /><hr />
    <h4>Ex32 – Route change lifecycle</h4><ex-32 /><hr />
    <h4>Ex33 – Service lifecycle (APP_INITIALIZER)</h4><ex-33 /><hr />
    <h4>Ex34 – Lifecycle with HTTP cleanup</h4><ex-34 /><hr />
    <h4>Ex35 – Lifecycle with WebSocket</h4><ex-35 /><hr />
    <h4>Ex36 – Lifecycle with timer</h4><ex-36 /><hr />
    <h4>Ex37 – Lifecycle with animation</h4><ex-37 /><hr />
    <h4>Ex38 – Full lifecycle timeline</h4><ex-38 [x]="1" /><hr />
    <h4>Ex39 – Lifecycle with signals (effect)</h4><ex-39 /><hr />
    <h4>Ex40 – afterRender scheduling</h4><ex-40 /><hr />
    <h4>Ex41 – afterNextRender for measurement</h4><ex-41 /><hr />
    <h4>Ex42 – Lifecycle hook replacement with signals</h4><ex-42 /><hr />
    <h4>Ex43 – inject() in field initializer</h4><ex-43 /><hr />
    <h4>Ex44 – Lifecycle with performance measurement</h4><ex-44 /><hr />
    <h4>Ex45 – Lifecycle with SSR</h4><ex-45 /><hr />
    <h4>Ex46 – Lifecycle with zone.js disabled</h4><ex-46 /><hr />
    <h4>Ex47 – Input signal changes (no ngOnChanges)</h4><ex-47 /><hr />
    <h4>Ex48 – Lifecycle testing patterns</h4><ex-48 /><hr />
    <h4>Ex49 – Lifecycle with ComponentRef</h4><ex-49 /><hr />
    <h4>Ex50 – Full lifecycle-optimized component</h4><ex-50 /><hr />
  `,
})
export class AppComponent {}
