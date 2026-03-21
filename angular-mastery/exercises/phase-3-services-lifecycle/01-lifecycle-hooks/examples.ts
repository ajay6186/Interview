import {
  Component, OnInit, OnDestroy, OnChanges, AfterViewInit, AfterContentInit,
  AfterViewChecked, AfterContentChecked, DoCheck, SimpleChanges, Input,
  ViewChild, ContentChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef,
  signal, computed, effect, inject, DestroyRef, afterRender, afterNextRender,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, interval, Subscription } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';

// ============================================================
// Examples 3.1 — Lifecycle Hooks (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ────────────────────────────────────────────

// 1. ngOnInit — basic initialization
@Component({ selector: 'ex-01', standalone: true, template: `<p>Init ran: {{ initRan }}</p>` })
class Ex01 implements OnInit {
  initRan = false;
  ngOnInit() { this.initRan = true; console.log('Ex01: ngOnInit'); }
}

// 2. ngOnDestroy — cleanup log
@Component({ selector: 'ex-02', standalone: true, template: `<p>Destroy logged to console on removal</p>` })
class Ex02 implements OnDestroy {
  ngOnDestroy() { console.log('Ex02: ngOnDestroy — component removed'); }
}

// 3. ngOnChanges — responds to @Input changes
@Component({ selector: 'ex-03', standalone: true, template: `<p>Value: {{ value }}</p>` })
class Ex03 implements OnChanges {
  @Input() value = 'initial';
  ngOnChanges(changes: SimpleChanges) { console.log('Ex03: ngOnChanges', changes); }
}

// 4. ngAfterViewInit — runs after view is rendered
@Component({ selector: 'ex-04', standalone: true, template: `<p #msg>View is ready</p>` })
class Ex04 implements AfterViewInit {
  @ViewChild('msg') msg!: ElementRef;
  ngAfterViewInit() { console.log('Ex04: ViewChild text:', this.msg.nativeElement.textContent); }
}

// 5. ngAfterContentInit — runs after content projection
@Component({ selector: 'ex-05', standalone: true, template: `<ng-content></ng-content><p>Content init logged</p>` })
class Ex05 implements AfterContentInit {
  ngAfterContentInit() { console.log('Ex05: ngAfterContentInit'); }
}

// 6. ngAfterViewChecked — runs after every view check
@Component({ selector: 'ex-06', standalone: true, template: `<p>AfterViewChecked fires on every CD cycle</p>` })
class Ex06 implements AfterViewChecked {
  ngAfterViewChecked() { console.log('Ex06: ngAfterViewChecked'); }
}

// 7. ngDoCheck — custom change detection
@Component({ selector: 'ex-07', standalone: true, template: `<p>DoCheck count: {{ checkCount }}</p>` })
class Ex07 implements DoCheck {
  checkCount = 0;
  ngDoCheck() { this.checkCount++; }
}

// 8. ngOnInit — setting up state from @Input
@Component({ selector: 'ex-08', standalone: true, template: `<p>Greeting: {{ greeting }}</p>` })
class Ex08 implements OnInit {
  @Input() name = 'World';
  greeting = '';
  ngOnInit() { this.greeting = `Hello, ${this.name}!`; }
}

// 9. ngOnDestroy — clearing a timeout
@Component({ selector: 'ex-09', standalone: true, template: `<p>Timer cleared on destroy</p>` })
class Ex09 implements OnDestroy {
  private timerId = setTimeout(() => console.log('Ex09: timer fires'), 5000);
  ngOnDestroy() { clearTimeout(this.timerId); console.log('Ex09: timer cleared'); }
}

// 10. ngAfterContentChecked — fires after content check
@Component({ selector: 'ex-10', standalone: true, template: `<p>Content checked</p>` })
class Ex10 implements AfterContentChecked {
  ngAfterContentChecked() { console.log('Ex10: ngAfterContentChecked'); }
}

// 11. ngOnInit — async-style data simulation
@Component({ selector: 'ex-11', standalone: true, template: `<p>{{ data }}</p>` })
class Ex11 implements OnInit {
  data = 'Loading...';
  ngOnInit() { setTimeout(() => { this.data = 'Data loaded!'; }, 500); }
}

// 12. ngOnInit — reading from localStorage
@Component({ selector: 'ex-12', standalone: true, template: `<p>Stored theme: {{ theme }}</p>` })
class Ex12 implements OnInit {
  theme = 'light';
  ngOnInit() { this.theme = localStorage.getItem('theme') ?? 'light'; }
}

// 13. ngOnDestroy — saving to localStorage
@Component({ selector: 'ex-13', standalone: true, template: `<p>State saved on destroy</p>` })
class Ex13 implements OnDestroy {
  private state = { visits: 1 };
  ngOnDestroy() { localStorage.setItem('ex13-state', JSON.stringify(this.state)); console.log('Ex13: saved'); }
}

// ─── INTERMEDIATE (14–26) ─────────────────────────────────────

// 14. Lifecycle ordering — log each hook in sequence
@Component({
  selector: 'ex-14', standalone: true,
  template: `<p>Check console for lifecycle order</p>`
})
class Ex14 implements OnInit, AfterViewInit, AfterContentInit, OnDestroy {
  constructor() { console.log('Ex14: constructor'); }
  ngOnChanges() { console.log('Ex14: ngOnChanges'); }
  ngOnInit() { console.log('Ex14: ngOnInit'); }
  ngAfterContentInit() { console.log('Ex14: ngAfterContentInit'); }
  ngAfterViewInit() { console.log('Ex14: ngAfterViewInit'); }
  ngOnDestroy() { console.log('Ex14: ngOnDestroy'); }
}

// 15. ngOnChanges with SimpleChanges detail
@Component({ selector: 'ex-15', standalone: true, template: `<p>prev: {{ prev }} | cur: {{ cur }}</p>` })
class Ex15 implements OnChanges {
  @Input() value = 0;
  prev: unknown = '—'; cur: unknown = '—';
  ngOnChanges(changes: SimpleChanges) {
    if (changes['value']) {
      this.prev = changes['value'].previousValue;
      this.cur = changes['value'].currentValue;
    }
  }
}

// 16. Input change detection — isFirstChange
@Component({ selector: 'ex-16', standalone: true, template: `<p>First change: {{ firstChange }}</p>` })
class Ex16 implements OnChanges {
  @Input() label = '';
  firstChange = true;
  ngOnChanges(changes: SimpleChanges) {
    if (changes['label']) { this.firstChange = changes['label'].isFirstChange(); }
  }
}

// 17. Init-based data loading pattern
@Component({ selector: 'ex-17', standalone: true, template: `<p>{{ status }}</p>` })
class Ex17 implements OnInit {
  status = 'idle';
  ngOnInit() {
    this.status = 'loading';
    setTimeout(() => { this.status = 'ready — users loaded'; }, 600);
  }
}

// 18. Cleanup pattern — unsubscribe in ngOnDestroy
@Component({ selector: 'ex-18', standalone: true, template: `<p>Tick: {{ tick }}</p>` })
class Ex18 implements OnInit, OnDestroy {
  tick = 0;
  private sub!: Subscription;
  ngOnInit() { this.sub = interval(1000).subscribe(() => this.tick++); }
  ngOnDestroy() { this.sub.unsubscribe(); console.log('Ex18: unsubscribed'); }
}

// 19. Subscription management with Subject
@Component({ selector: 'ex-19', standalone: true, template: `<p>Count: {{ count }}</p>` })
class Ex19 implements OnInit, OnDestroy {
  count = 0;
  private destroy$ = new Subject<void>();
  ngOnInit() { interval(1000).pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(() => this.count++); }
  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
}

// 20. ViewChild available in ngAfterViewInit
@Component({
  selector: 'ex-20', standalone: true,
  template: `<canvas #myCanvas width="100" height="40" style="border:1px solid #ccc"></canvas><p>{{ msg }}</p>`
})
class Ex20 implements AfterViewInit {
  @ViewChild('myCanvas') canvas!: ElementRef<HTMLCanvasElement>;
  msg = 'waiting...';
  ngAfterViewInit() {
    const ctx = this.canvas.nativeElement.getContext('2d')!;
    ctx.fillStyle = 'steelblue';
    ctx.fillRect(0, 0, 100, 40);
    this.msg = 'canvas drawn';
  }
}

// 21. ContentChild in ngAfterContentInit
@Component({
  selector: 'ex-21-inner', standalone: true,
  template: `<p #projected>Projected Content</p>`
})
class Ex21Inner {}

@Component({
  selector: 'ex-21', standalone: true, imports: [Ex21Inner],
  template: `<ex-21-inner><span #slot>slot text</span></ex-21-inner><p>{{ childMsg }}</p>`
})
class Ex21 implements AfterContentInit {
  @ContentChild('slot') slot?: ElementRef;
  childMsg = 'waiting';
  ngAfterContentInit() { this.childMsg = 'ContentChild found: ' + (this.slot ? 'yes' : 'no'); }
}

// 22. DoCheck — detecting deep object mutation
@Component({ selector: 'ex-22', standalone: true, template: `<p>{{ label }}</p><button (click)="mutate()">Mutate</button>` })
class Ex22 implements DoCheck {
  item = { count: 0 };
  label = 'count: 0';
  private prev = 0;
  mutate() { this.item.count++; }
  ngDoCheck() {
    if (this.item.count !== this.prev) { this.prev = this.item.count; this.label = 'count: ' + this.item.count; }
  }
}

// 23. ngAfterViewChecked — responding to child view updates
@Component({ selector: 'ex-23', standalone: true, template: `<p>{{ result }}</p><button (click)="val = val + 1">+1</button>` })
class Ex23 implements AfterViewChecked {
  val = 0; result = '';
  ngAfterViewChecked() { this.result = `AfterViewChecked: val is ${this.val}`; }
}

// 24. ngOnInit — computed property setup
@Component({ selector: 'ex-24', standalone: true, template: `<p>Items: {{ itemList }}</p>` })
class Ex24 implements OnInit {
  raw = ['apple', 'banana', 'cherry'];
  itemList = '';
  ngOnInit() { this.itemList = this.raw.map((x, i) => `${i + 1}. ${x}`).join(' | '); }
}

// 25. ngOnDestroy — emitting an event before destroy
@Component({ selector: 'ex-25', standalone: true, template: `<p>Destroy event emitted to console</p>` })
class Ex25 implements OnDestroy {
  private beforeDestroy$ = new Subject<void>();
  ngOnDestroy() { this.beforeDestroy$.next(); this.beforeDestroy$.complete(); console.log('Ex25: beforeDestroy$ emitted'); }
}

// 26. Multiple lifecycle hooks — combined demo
@Component({
  selector: 'ex-26', standalone: true,
  template: `<p>Logs: {{ logs.join(' → ') }}</p>`
})
class Ex26 implements OnInit, AfterViewInit, OnDestroy {
  logs: string[] = [];
  ngOnInit() { this.logs.push('Init'); }
  ngAfterViewInit() { this.logs.push('ViewInit'); }
  ngOnDestroy() { this.logs.push('Destroy'); console.log('Ex26:', this.logs.join(' → ')); }
}

// ─── NESTED (27–38) ───────────────────────────────────────────

// 27. Parent-child lifecycle order
@Component({ selector: 'ex-27-child', standalone: true, template: `<span>child</span>` })
class Ex27Child implements OnInit, OnDestroy {
  ngOnInit() { console.log('Ex27 Child: ngOnInit'); }
  ngOnDestroy() { console.log('Ex27 Child: ngOnDestroy'); }
}

@Component({
  selector: 'ex-27', standalone: true, imports: [Ex27Child],
  template: `<p>Check console for parent/child order</p><ex-27-child />`
})
class Ex27 implements OnInit, OnDestroy {
  ngOnInit() { console.log('Ex27 Parent: ngOnInit'); }
  ngOnDestroy() { console.log('Ex27 Parent: ngOnDestroy'); }
}

// 28. Child ngOnChanges when parent updates
@Component({ selector: 'ex-28-child', standalone: true, template: `<span>{{ val }}</span>` })
class Ex28Child implements OnChanges {
  @Input() val = 0;
  ngOnChanges(c: SimpleChanges) { console.log('Ex28 Child: val changed to', c['val']?.currentValue); }
}

@Component({
  selector: 'ex-28', standalone: true, imports: [Ex28Child],
  template: `<ex-28-child [val]="counter" /><button (click)="counter++">Increment</button>`
})
class Ex28 { counter = 0; }

// 29. Component with all hooks implemented
@Component({
  selector: 'ex-29', standalone: true,
  template: `<p>All hooks: {{ hooks.join(', ') }}</p>`
})
class Ex29 implements OnInit, OnChanges, DoCheck, AfterContentInit, AfterContentChecked, AfterViewInit, AfterViewChecked, OnDestroy {
  hooks: string[] = [];
  ngOnChanges() { this.hooks.includes('OnChanges') || this.hooks.push('OnChanges'); }
  ngOnInit() { this.hooks.push('OnInit'); }
  ngDoCheck() { this.hooks.includes('DoCheck') || this.hooks.push('DoCheck'); }
  ngAfterContentInit() { this.hooks.push('AfterContentInit'); }
  ngAfterContentChecked() { this.hooks.includes('AfterContentChecked') || this.hooks.push('AfterContentChecked'); }
  ngAfterViewInit() { this.hooks.push('AfterViewInit'); }
  ngAfterViewChecked() { this.hooks.includes('AfterViewChecked') || this.hooks.push('AfterViewChecked'); }
  ngOnDestroy() { console.log('Ex29: full hooks sequence:', this.hooks); }
}

// 30. Lifecycle with signals — signal updated in ngOnInit
@Component({
  selector: 'ex-30', standalone: true,
  template: `<p>{{ message() }}</p><button (click)="update()">Update</button>`
})
class Ex30 implements OnInit {
  message = signal('not initialized');
  count = signal(0);
  ngOnInit() { this.message.set('initialized via ngOnInit'); }
  update() { this.count.update(n => n + 1); this.message.set(`updated ${this.count()} times`); }
}

// 31. Lifecycle with observables — interval + takeUntilDestroyed
@Component({ selector: 'ex-31', standalone: true, template: `<p>Seconds: {{ seconds }}</p>` })
class Ex31 implements OnInit {
  seconds = 0;
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    interval(1000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.seconds++);
  }
}

// 32. Lifecycle with simulated HTTP — loading pattern
@Component({
  selector: 'ex-32', standalone: true,
  template: `
    @if (loading) { <p>Loading...</p> }
    @else { <ul>@for (item of items; track item) { <li>{{ item }}</li> }</ul> }
  `
})
class Ex32 implements OnInit {
  loading = true;
  items: string[] = [];
  ngOnInit() {
    setTimeout(() => {
      this.items = ['Item A', 'Item B', 'Item C'];
      this.loading = false;
    }, 800);
  }
}

// 33. Multiple children with individual lifecycle logs
@Component({ selector: 'ex-33-a', standalone: true, template: `<span>A</span>` })
class Ex33A implements OnInit { ngOnInit() { console.log('Ex33A: init'); } }

@Component({ selector: 'ex-33-b', standalone: true, template: `<span>B</span>` })
class Ex33B implements OnInit { ngOnInit() { console.log('Ex33B: init'); } }

@Component({
  selector: 'ex-33', standalone: true, imports: [Ex33A, Ex33B],
  template: `<ex-33-a /> <ex-33-b /><p>Children init order in console</p>`
})
class Ex33 {}

// 34. Parent passes data to child, child reacts in ngOnChanges
@Component({ selector: 'ex-34-child', standalone: true, template: `<p>Doubled: {{ doubled }}</p>` })
class Ex34Child implements OnChanges {
  @Input() value = 0;
  doubled = 0;
  ngOnChanges(c: SimpleChanges) { if (c['value']) { this.doubled = this.value * 2; } }
}

@Component({
  selector: 'ex-34', standalone: true, imports: [Ex34Child],
  template: `<ex-34-child [value]="num" /><button (click)="num = num + 3">+3</button>`
})
class Ex34 { num = 5; }

// 35. Signal with effect in component lifecycle
@Component({
  selector: 'ex-35', standalone: true,
  template: `<p>Count: {{ count() }}</p><button (click)="count.update(n => n + 1)">+1</button>`
})
class Ex35 implements OnInit {
  count = signal(0);
  ngOnInit() {
    effect(() => { console.log('Ex35 effect: count is', this.count()); });
  }
}

// 36. ngAfterViewInit — focus an input element
@Component({
  selector: 'ex-36', standalone: true,
  template: `<input #inp placeholder="auto-focused" style="border:1px solid #ccc;padding:4px" />`
})
class Ex36 implements AfterViewInit {
  @ViewChild('inp') inp!: ElementRef<HTMLInputElement>;
  ngAfterViewInit() { this.inp.nativeElement.focus(); }
}

// 37. Conditional child with lifecycle (show/hide)
@Component({ selector: 'ex-37-child', standalone: true, template: `<p>I am alive</p>` })
class Ex37Child implements OnInit, OnDestroy {
  ngOnInit() { console.log('Ex37Child: mounted'); }
  ngOnDestroy() { console.log('Ex37Child: destroyed'); }
}

@Component({
  selector: 'ex-37', standalone: true, imports: [Ex37Child],
  template: `
    @if (visible) { <ex-37-child /> }
    <button (click)="visible = !visible">{{ visible ? 'Hide' : 'Show' }}</button>
  `
})
class Ex37 { visible = true; }

// 38. ngOnInit + ngOnChanges in tandem with parent signal
@Component({ selector: 'ex-38-child', standalone: true, template: `<p>{{ label }}</p>` })
class Ex38Child implements OnInit, OnChanges {
  @Input() title = '';
  label = '';
  ngOnInit() { this.label = `[init] ${this.title}`; }
  ngOnChanges(c: SimpleChanges) {
    if (c['title'] && !c['title'].isFirstChange()) { this.label = `[changed] ${this.title}`; }
  }
}

@Component({
  selector: 'ex-38', standalone: true, imports: [Ex38Child],
  template: `<ex-38-child [title]="t()" /><button (click)="t.set(t() === 'A' ? 'B' : 'A')">Toggle</button>`
})
class Ex38 { t = signal('A'); }

// ─── ADVANCED (39–50) ─────────────────────────────────────────

// 39. takeUntilDestroyed — auto-unsubscribe pattern
@Component({ selector: 'ex-39', standalone: true, template: `<p>Auto-unsubscribe tick: {{ tick }}</p>` })
class Ex39 implements OnInit {
  tick = 0;
  private destroyRef = inject(DestroyRef);
  ngOnInit() {
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(n => { this.tick = n; });
  }
}

// 40. DestroyRef.onDestroy callback
@Component({ selector: 'ex-40', standalone: true, template: `<p>DestroyRef.onDestroy registered</p>` })
class Ex40 {
  constructor() {
    inject(DestroyRef).onDestroy(() => console.log('Ex40: DestroyRef.onDestroy fired'));
  }
}

// 41. afterRender — runs after every render
@Component({ selector: 'ex-41', standalone: true, template: `<p>afterRender count: {{ count }}</p><button (click)="count = count + 1">Re-render</button>` })
class Ex41 {
  count = 0;
  constructor() {
    afterRender(() => { console.log('Ex41: afterRender fired, count=', this.count); });
  }
}

// 42. afterNextRender — runs once after first render
@Component({ selector: 'ex-42', standalone: true, template: `<p #el>afterNextRender ready: {{ ready }}</p>` })
class Ex42 {
  ready = false;
  @ViewChild('el') el!: ElementRef;
  constructor() {
    afterNextRender(() => { this.ready = true; console.log('Ex42: afterNextRender — DOM ready'); });
  }
}

// 43. inject() in constructor replacing manual injection
@Component({
  selector: 'ex-43', standalone: true,
  template: `<p>inject() works in field initializer too</p>`
})
class Ex43 {
  private destroyRef = inject(DestroyRef);
  private sub = interval(2000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(n => console.log('Ex43 tick', n));
}

// 44. OnPush + DoCheck with signal
@Component({
  selector: 'ex-44', standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>OnPush count: {{ count() }}</p><button (click)="count.update(n => n + 1)">+1</button>`
})
class Ex44 implements DoCheck {
  count = signal(0);
  private cdr = inject(ChangeDetectorRef);
  ngDoCheck() { this.cdr.markForCheck(); }
}

// 45. Signal-based reactivity replacing DoCheck
@Component({
  selector: 'ex-45', standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Name: {{ displayName() }}</p><button (click)="name.set('Angular 17')">Set Name</button>`
})
class Ex45 {
  name = signal('initial');
  displayName = computed(() => this.name().toUpperCase());
}

// 46. effect() with cleanup function
@Component({
  selector: 'ex-46', standalone: true,
  template: `<p>Interval val: {{ val() }}</p><button (click)="val.update(n => n + 1)">+1</button>`
})
class Ex46 {
  val = signal(0);
  constructor() {
    effect((onCleanup) => {
      const id = setInterval(() => console.log('Ex46 effect: val=', this.val()), 2000);
      onCleanup(() => { clearInterval(id); console.log('Ex46: effect cleanup'); });
    });
  }
}

// 47. Lifecycle + Router NavigationEnd events
@Component({
  selector: 'ex-47', standalone: true,
  template: `<p>Router events: {{ navCount }}</p>`
})
class Ex47 implements OnInit {
  navCount = 0;
  private destroyRef = inject(DestroyRef);
  private router = inject(Router, { optional: true });
  ngOnInit() {
    if (this.router) {
      this.router.events
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(e => { if (e instanceof NavigationEnd) this.navCount++; });
    }
  }
}

// 48. Full lifecycle component — all hooks in one
@Component({
  selector: 'ex-48', standalone: true,
  template: `
    <p>Phase: {{ phase }}</p>
    <p>DoCheck runs: {{ checkRuns }}</p>
    <button (click)="step = step + 1">Trigger DoCheck</button>
  `
})
class Ex48 implements OnInit, OnChanges, DoCheck, AfterContentInit, AfterContentChecked, AfterViewInit, AfterViewChecked, OnDestroy {
  @Input() input = '';
  phase = 'constructed';
  checkRuns = 0;
  step = 0;
  ngOnChanges() { this.phase = 'OnChanges'; }
  ngOnInit() { this.phase = 'OnInit'; }
  ngDoCheck() { this.checkRuns++; }
  ngAfterContentInit() { this.phase = 'AfterContentInit'; }
  ngAfterContentChecked() {}
  ngAfterViewInit() { this.phase = 'AfterViewInit'; }
  ngAfterViewChecked() {}
  ngOnDestroy() { console.log('Ex48: destroyed after', this.checkRuns, 'checks'); }
}

// 49. Signal effect with allowSignalWrites
@Component({
  selector: 'ex-49', standalone: true,
  template: `<p>Source: {{ source() }} | Mirror: {{ mirror() }}</p><button (click)="source.update(n => n + 1)">+1</button>`
})
class Ex49 {
  source = signal(0);
  mirror = signal(0);
  constructor() {
    effect(() => {
      const v = this.source();
      this.mirror.set(v * 10);
    }, { allowSignalWrites: true });
  }
}

// 50. Lifecycle + signals + DestroyRef — production-grade pattern
@Component({
  selector: 'ex-50', standalone: true,
  template: `
    <p>Status: {{ status() }}</p>
    <p>Data: {{ data() }}</p>
    <p>Elapsed: {{ elapsed() }}s</p>
    <button (click)="reload()">Reload</button>
  `
})
class Ex50 implements OnInit {
  status = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  data = signal<string>('—');
  elapsed = signal(0);
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    interval(1000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.elapsed.update(n => n + 1));
    this.load();
  }

  reload() { this.data.set('—'); this.load(); }

  private load() {
    this.status.set('loading');
    setTimeout(() => {
      this.data.set('User: Alice | Role: Admin');
      this.status.set('ready');
    }, 700);
  }
}

// ─── App Root ─────────────────────────────────────────────────

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
    <div style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:20px">
      <h1>Examples 3.1 — Lifecycle Hooks</h1>
      <h4>1. ngOnInit — basic initialization</h4><ex-01 /><hr />
      <h4>2. ngOnDestroy — cleanup log</h4><ex-02 /><hr />
      <h4>3. ngOnChanges — responds to @Input changes</h4><ex-03 /><hr />
      <h4>4. ngAfterViewInit — ViewChild access</h4><ex-04 /><hr />
      <h4>5. ngAfterContentInit — content projection</h4><ex-05 /><hr />
      <h4>6. ngAfterViewChecked — fires on CD</h4><ex-06 /><hr />
      <h4>7. ngDoCheck — custom change detection</h4><ex-07 /><hr />
      <h4>8. ngOnInit — state from @Input</h4><ex-08 /><hr />
      <h4>9. ngOnDestroy — clearing a timeout</h4><ex-09 /><hr />
      <h4>10. ngAfterContentChecked</h4><ex-10 /><hr />
      <h4>11. ngOnInit — async data simulation</h4><ex-11 /><hr />
      <h4>12. ngOnInit — reading from localStorage</h4><ex-12 /><hr />
      <h4>13. ngOnDestroy — saving to localStorage</h4><ex-13 /><hr />
      <h4>14. Lifecycle ordering — log sequence</h4><ex-14 /><hr />
      <h4>15. ngOnChanges with SimpleChanges detail</h4><ex-15 /><hr />
      <h4>16. Input change — isFirstChange</h4><ex-16 /><hr />
      <h4>17. Init-based data loading pattern</h4><ex-17 /><hr />
      <h4>18. Cleanup — unsubscribe in ngOnDestroy</h4><ex-18 /><hr />
      <h4>19. Subscription management with takeUntilDestroyed</h4><ex-19 /><hr />
      <h4>20. ViewChild in ngAfterViewInit — canvas</h4><ex-20 /><hr />
      <h4>21. ContentChild in ngAfterContentInit</h4><ex-21 /><hr />
      <h4>22. DoCheck — deep object mutation</h4><ex-22 /><hr />
      <h4>23. ngAfterViewChecked — child view updates</h4><ex-23 /><hr />
      <h4>24. ngOnInit — computed property setup</h4><ex-24 /><hr />
      <h4>25. ngOnDestroy — emitting before destroy</h4><ex-25 /><hr />
      <h4>26. Multiple lifecycle hooks combined</h4><ex-26 /><hr />
      <h4>27. Parent-child lifecycle order</h4><ex-27 /><hr />
      <h4>28. Child ngOnChanges when parent updates</h4><ex-28 /><hr />
      <h4>29. All hooks implemented in one component</h4><ex-29 /><hr />
      <h4>30. Lifecycle with signals — ngOnInit</h4><ex-30 /><hr />
      <h4>31. Lifecycle with observables — interval</h4><ex-31 /><hr />
      <h4>32. Simulated HTTP loading in ngOnInit</h4><ex-32 /><hr />
      <h4>33. Multiple children with individual logs</h4><ex-33 /><hr />
      <h4>34. Parent → child ngOnChanges reaction</h4><ex-34 /><hr />
      <h4>35. Signal with effect in ngOnInit</h4><ex-35 /><hr />
      <h4>36. ngAfterViewInit — focus input</h4><ex-36 /><hr />
      <h4>37. Conditional child with lifecycle</h4><ex-37 /><hr />
      <h4>38. ngOnInit + ngOnChanges with parent signal</h4><ex-38 /><hr />
      <h4>39. takeUntilDestroyed — auto-unsubscribe</h4><ex-39 /><hr />
      <h4>40. DestroyRef.onDestroy callback</h4><ex-40 /><hr />
      <h4>41. afterRender — every render</h4><ex-41 /><hr />
      <h4>42. afterNextRender — once after first render</h4><ex-42 /><hr />
      <h4>43. inject() in field initializer</h4><ex-43 /><hr />
      <h4>44. OnPush + DoCheck with signal</h4><ex-44 /><hr />
      <h4>45. Signal reactivity replacing DoCheck</h4><ex-45 /><hr />
      <h4>46. effect() with cleanup function</h4><ex-46 /><hr />
      <h4>47. Lifecycle + Router NavigationEnd</h4><ex-47 /><hr />
      <h4>48. Full lifecycle component — all hooks</h4><ex-48 /><hr />
      <h4>49. Signal effect with allowSignalWrites</h4><ex-49 /><hr />
      <h4>50. Production-grade lifecycle + signals + DestroyRef</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
