// Phase 6 - Solution 02: Lifecycle Hooks
// Topics: ngOnInit, ngOnChanges(SimpleChanges), ngOnDestroy, ngAfterViewInit,
//         ngAfterContentInit, DestroyRef

import {
  Component, Input, signal, inject, ViewChild, ContentChild,
  ElementRef, DestroyRef, OnInit, OnChanges, OnDestroy,
  AfterViewInit, AfterContentInit, AfterViewChecked,
  AfterContentChecked, DoCheck, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ─────────────────────────────────────────────────────────────────────────────
// 1. LifecycleLogComponent — logs every hook
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-lifecycle-child',
  standalone: true,
  template: `
    <div style="background:white; padding:0.5rem; border-radius:4px; font-size:0.8rem; max-height:200px; overflow-y:auto">
      @for (log of logs; track $index) {
        <div [style.color]="logColor(log)">{{ log }}</div>
      }
    </div>
  `,
})
export class LifecycleChildComponent implements OnInit, OnChanges, DoCheck,
    AfterContentInit, AfterContentChecked, AfterViewInit, AfterViewChecked, OnDestroy {

  @Input() value = '';
  logs: string[] = [];

  private ts(): string {
    return new Date().toISOString().substring(11, 23);
  }

  ngOnChanges(changes: SimpleChanges) {
    this.logs.push(`ngOnChanges @ ${this.ts()} — value: "${changes['value']?.currentValue}"`);
  }
  ngOnInit()              { this.logs.push(`ngOnInit @ ${this.ts()}`); }
  ngDoCheck()             { this.logs.push(`ngDoCheck @ ${this.ts()}`); }
  ngAfterContentInit()    { this.logs.push(`ngAfterContentInit @ ${this.ts()}`); }
  ngAfterContentChecked() { this.logs.push(`ngAfterContentChecked @ ${this.ts()}`); }
  ngAfterViewInit()       { this.logs.push(`ngAfterViewInit @ ${this.ts()}`); }
  ngAfterViewChecked()    { this.logs.push(`ngAfterViewChecked @ ${this.ts()}`); }
  ngOnDestroy()           { this.logs.push(`ngOnDestroy @ ${this.ts()}`); }

  logColor(log: string): string {
    if (log.includes('OnInit'))              return '#1565c0';
    if (log.includes('OnChanges'))           return '#6a1b9a';
    if (log.includes('OnDestroy'))           return '#c62828';
    if (log.includes('AfterViewInit'))       return '#2e7d32';
    if (log.includes('AfterContentInit'))    return '#e65100';
    return '#666';
  }
}

@Component({
  selector: 'app-lifecycle-log',
  standalone: true,
  imports: [LifecycleChildComponent, FormsModule],
  template: `
    <div style="padding:1.5rem; background:#e8eaf6; border-radius:8px; margin-bottom:1rem">
      <h3>Lifecycle Hook Log</h3>
      <div style="display:flex; gap:0.5rem; margin-bottom:0.75rem; align-items:center">
        <input [(ngModel)]="inputValue" placeholder="Change input value"
               style="flex:1; padding:0.4rem; border:1px solid #9fa8da; border-radius:4px" />
        @if (!showChild) {
          <button (click)="showChild = true"
                  style="padding:0.4rem 0.75rem; background:#3949ab; color:white; border:none; border-radius:4px; cursor:pointer">
            Mount Child
          </button>
        } @else {
          <button (click)="showChild = false"
                  style="padding:0.4rem 0.75rem; background:#c62828; color:white; border:none; border-radius:4px; cursor:pointer">
            Destroy Child
          </button>
        }
      </div>
      @if (showChild) {
        <app-lifecycle-child [value]="inputValue" />
      }
      <p style="font-size:0.85rem; color:#555; margin-top:0.5rem">
        Mount/destroy the child and change the input to see all lifecycle hooks fire.
      </p>
    </div>
  `,
})
export class LifecycleLogComponent {
  inputValue = 'hello';
  showChild  = false;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. OnChanges — previousValue / currentValue / firstChange
// ─────────────────────────────────────────────────────────────────────────────

interface ChangeRecord { prev: string; curr: string; first: boolean; }

@Component({
  selector: 'app-changes-child',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="background:white; padding:0.75rem; border-radius:4px">
      <strong>OnChanges Child</strong>
      <table style="width:100%; border-collapse:collapse; font-size:0.85rem; margin-top:0.5rem">
        <thead>
          <tr style="background:#7b1fa2; color:white">
            <th style="padding:0.3rem">#</th>
            <th style="padding:0.3rem">previousValue</th>
            <th style="padding:0.3rem">currentValue</th>
            <th style="padding:0.3rem">firstChange</th>
          </tr>
        </thead>
        <tbody>
          @for (rec of history; track $index) {
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:0.3rem; text-align:center">{{ $index + 1 }}</td>
              <td style="padding:0.3rem; color:#c62828">{{ rec.prev ?? '—' }}</td>
              <td style="padding:0.3rem; color:#2e7d32">{{ rec.curr }}</td>
              <td style="padding:0.3rem; text-align:center">{{ rec.first }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class OnChangesChildComponent implements OnChanges {
  @Input() message = '';
  history: ChangeRecord[] = [];

  ngOnChanges(changes: SimpleChanges) {
    const c = changes['message'];
    if (c) {
      this.history.push({
        prev:  c.previousValue,
        curr:  c.currentValue,
        first: c.firstChange,
      });
    }
  }
}

@Component({
  selector: 'app-onchanges-demo',
  standalone: true,
  imports: [OnChangesChildComponent, FormsModule],
  template: `
    <div style="padding:1.5rem; background:#f3e5f5; border-radius:8px; margin-bottom:1rem">
      <h3>ngOnChanges — SimpleChanges</h3>

      <div style="display:flex; gap:0.5rem; margin-bottom:0.75rem; flex-wrap:wrap">
        <button (click)="setMessage('Hello Angular')"
                style="padding:0.4rem 0.75rem; background:#7b1fa2; color:white; border:none; border-radius:4px; cursor:pointer">
          Set "Hello Angular"
        </button>
        <button (click)="setMessage('Hello NgRx')"
                style="padding:0.4rem 0.75rem; background:#6a1b9a; color:white; border:none; border-radius:4px; cursor:pointer">
          Set "Hello NgRx"
        </button>
        <button (click)="setMessage('Hello Signals')"
                style="padding:0.4rem 0.75rem; background:#4a148c; color:white; border:none; border-radius:4px; cursor:pointer">
          Set "Hello Signals"
        </button>
      </div>

      <p style="margin:0 0 0.5rem; font-size:0.9rem">Current message: <em>{{ message }}</em></p>
      <app-changes-child [message]="message" />
    </div>
  `,
})
export class OnChangesDemoComponent {
  message = 'initial';
  setMessage(m: string) { this.message = m; }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. DestroyRef — inject-based cleanup
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-destroyref-inner',
  standalone: true,
  template: `
    <div style="background:white; padding:0.75rem; border-radius:4px">
      <strong>DestroyRef Demo</strong><br/>
      Timer: <strong style="font-size:1.5rem">{{ elapsed() }}</strong>s
      <p style="font-size:0.85rem; color:#555; margin:0.4rem 0 0">
        An interval runs every 500ms. DestroyRef cleans it up automatically when this
        component is removed — no ngOnDestroy class needed!
      </p>
    </div>
  `,
})
export class DestroyRefInnerComponent {
  elapsed = signal(0);

  constructor() {
    const destroyRef = inject(DestroyRef);
    const id = setInterval(() => this.elapsed.update(e => e + 0.5), 500);

    // Register cleanup — runs when the component's injector is destroyed
    destroyRef.onDestroy(() => {
      clearInterval(id);
      console.log('[DestroyRef] Interval cleared!');
    });
  }
}

@Component({
  selector: 'app-destroyref-demo',
  standalone: true,
  imports: [DestroyRefInnerComponent],
  template: `
    <div style="padding:1.5rem; background:#e0f7fa; border-radius:8px; margin-bottom:1rem">
      <h3>DestroyRef — Inject-Based Cleanup</h3>

      <button (click)="show = !show"
              [style.background]="show ? '#c62828' : '#00838f'"
              style="padding:0.4rem 0.75rem; color:white; border:none; border-radius:4px; cursor:pointer; margin-bottom:0.75rem">
        {{ show ? 'Destroy Component' : 'Mount Component' }}
      </button>

      @if (show) {
        <app-destroyref-inner />
      }

      <div style="margin-top:0.75rem; font-size:0.85rem; background:#e0f2f1; padding:0.75rem; border-radius:4px">
        <strong>DestroyRef vs ngOnDestroy:</strong>
        <ul style="margin:0.5rem 0 0; padding-left:1.25rem">
          <li><code>inject(DestroyRef).onDestroy(cb)</code> — works in constructor, services, factories</li>
          <li><code>ngOnDestroy()</code> — works only in component/directive classes</li>
          <li>DestroyRef enables cleanup in standalone functions (guards, resolvers)</li>
          <li>Both can be used together; DestroyRef is more composable</li>
        </ul>
      </div>
    </div>
  `,
})
export class DestroyRefDemoComponent {
  show = false;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. AfterViewInit — ViewChild available only after ngAfterViewInit
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-afterviewinit-demo',
  standalone: true,
  template: `
    <div style="padding:1.5rem; background:#fff8e1; border-radius:8px; margin-bottom:1rem">
      <h3>ngAfterViewInit — @ViewChild</h3>
      <canvas #myCanvas width="200" height="80"
              style="border:1px solid #ccc; border-radius:4px; display:block; margin:0.5rem 0"></canvas>
      <p style="font-size:0.85rem; color:#555">
        Canvas is drawn in <code>ngAfterViewInit</code> — the first lifecycle hook where
        <code>@ViewChild</code> references are guaranteed to be non-null.
      </p>
      <div style="font-size:0.85rem; background:#fff3e0; padding:0.75rem; border-radius:4px">
        <strong>Rule:</strong> Never access <code>@ViewChild</code> / <code>@ViewChildren</code>
        in <code>ngOnInit</code> — they are <code>undefined</code> at that point.
      </div>
    </div>
  `,
})
export class AfterViewInitDemoComponent implements OnInit, AfterViewInit {
  @ViewChild('myCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  ngOnInit() {
    // canvasRef is UNDEFINED here — do NOT access it
    console.log('[ngOnInit] canvasRef:', this.canvasRef); // undefined
  }

  ngAfterViewInit() {
    // canvasRef is available here
    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#1565c0';
    ctx.fillRect(10, 10, 180, 60);
    ctx.fillStyle = 'white';
    ctx.font = '14px sans-serif';
    ctx.fillText('Drawn in ngAfterViewInit ✓', 15, 45);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. ContentChild — available in ngAfterContentInit
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-card-header',
  standalone: true,
  template: `<h4 style="margin:0; color:#1565c0">{{ title }}</h4>`,
})
export class CardHeaderComponent {
  @Input() title = '';
}

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="border:2px solid #90caf9; border-radius:8px; padding:0.75rem; margin-top:0.5rem">
      <ng-content select="app-card-header" />
      <div style="margin-top:0.5rem">
        <ng-content />
      </div>
      @if (headerTitle) {
        <p style="font-size:0.8rem; color:#555; margin:0.5rem 0 0">
          ContentChild read: "<em>{{ headerTitle }}</em>"
        </p>
      }
    </div>
  `,
})
export class CardComponent implements OnInit, AfterContentInit {
  @ContentChild(CardHeaderComponent) header?: CardHeaderComponent;
  headerTitle = '';

  ngOnInit() {
    // header is UNDEFINED here
    console.log('[ngOnInit] ContentChild:', this.header);
  }

  ngAfterContentInit() {
    // header is available here
    this.headerTitle = this.header?.title ?? '';
    console.log('[ngAfterContentInit] ContentChild:', this.header);
  }
}

@Component({
  selector: 'app-contentchild-demo',
  standalone: true,
  imports: [CardComponent, CardHeaderComponent],
  template: `
    <div style="padding:1.5rem; background:#e8f5e9; border-radius:8px; margin-bottom:1rem">
      <h3>ngAfterContentInit — @ContentChild</h3>
      <p style="font-size:0.9rem; color:#555">
        <code>@ContentChild</code> is only available after <code>ngAfterContentInit</code>.
        Using it in <code>ngOnInit</code> returns <code>undefined</code>.
      </p>
      <app-card>
        <app-card-header title="My Custom Card" />
        <p>This is the card body content projected via ng-content.</p>
      </app-card>
    </div>
  `,
})
export class ContentChildDemoComponent {}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    LifecycleLogComponent,
    OnChangesDemoComponent,
    DestroyRefDemoComponent,
    AfterViewInitDemoComponent,
    ContentChildDemoComponent,
  ],
  template: `
    <div style="font-family:sans-serif; max-width:800px; margin:2rem auto; padding:0 1rem">
      <h1>Phase 6 – Lifecycle Hooks</h1>
      <app-lifecycle-log />
      <app-onchanges-demo />
      <app-destroyref-demo />
      <app-afterviewinit-demo />
      <app-contentchild-demo />
      <div style="padding:1rem; background:#f5f5f5; border-radius:8px; font-size:0.85rem">
        <strong>Lifecycle Hook Order:</strong>
        <ol style="margin:0.5rem 0 0">
          <li>constructor</li>
          <li>ngOnChanges (if @Input changes)</li>
          <li>ngOnInit</li>
          <li>ngDoCheck</li>
          <li>ngAfterContentInit → ngAfterContentChecked</li>
          <li>ngAfterViewInit → ngAfterViewChecked</li>
          <li>(ngDoCheck + ngAfterContentChecked + ngAfterViewChecked repeat each CD cycle)</li>
          <li>ngOnDestroy</li>
        </ol>
        <p style="margin-top:0.5rem">
          <strong>Key rules:</strong>
          @ViewChild available in <code>ngAfterViewInit</code>;
          @ContentChild available in <code>ngAfterContentInit</code>;
          use <code>inject(DestroyRef)</code> for functional cleanup.
        </p>
      </div>
    </div>
  `,
})
export class AppComponent {}
