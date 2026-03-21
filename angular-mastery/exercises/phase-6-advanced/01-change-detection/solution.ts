// Phase 6 - Solution 01: Change Detection
// Topics: ChangeDetectionStrategy.OnPush, markForCheck, detectChanges,
//         ChangeDetectorRef, signal() automatic tracking

import {
  Component, signal, Input, ChangeDetectionStrategy,
  ChangeDetectorRef, inject, OnInit, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';

// ─────────────────────────────────────────────────────────────────────────────
// 1 & 2. OnPush with @Input() — reference vs mutation
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-onpush-child',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="background:white; padding:0.5rem; border-radius:4px; margin-top:0.4rem">
      <strong>OnPush Child</strong> — User: {{ user.name }}, Age: {{ user.age }}
      <span style="font-size:0.75rem; color:#888; margin-left:0.4rem">(renders: {{ renderCount }})</span>
    </div>
  `,
})
export class OnPushChildComponent {
  @Input() user!: { name: string; age: number };
  renderCount = 0;

  ngDoCheck() { this.renderCount++; }
}

@Component({
  selector: 'app-mutation-demo',
  standalone: true,
  imports: [OnPushChildComponent],
  template: `
    <div style="padding:1.5rem; background:#fff3e0; border-radius:8px; margin-bottom:1rem">
      <h3>OnPush + Reference vs Mutation</h3>

      <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.75rem">
        <button (click)="mutateBad()"
                style="padding:0.4rem 0.75rem; background:#c62828; color:white; border:none; border-radius:4px; cursor:pointer">
          Mutate (BAD)
        </button>
        <button (click)="spreadGood()"
                style="padding:0.4rem 0.75rem; background:#2e7d32; color:white; border:none; border-radius:4px; cursor:pointer">
          Spread (GOOD)
        </button>
      </div>

      <p style="font-size:0.85rem; margin:0 0 0.5rem; color:#e65100">
        Parent user object: {{ user.name }}, {{ user.age }}
      </p>
      <app-onpush-child [user]="user" />

      <div style="margin-top:0.75rem; font-size:0.85rem; background:#fbe9e7; padding:0.75rem; border-radius:4px">
        <strong>BAD (mutation):</strong> <code>this.user.name = 'New'</code> — same object reference,
        OnPush sees no change, view stays stale.<br/><br/>
        <strong>GOOD (spread):</strong> <code>this.user = &#123; ...this.user, name: 'New' &#125;</code> —
        new object reference, OnPush detects the change and re-renders.
      </div>
    </div>
  `,
})
export class MutationDemoComponent {
  user = { name: 'Alice', age: 30 };
  mutationCount = 0;

  mutateBad() {
    this.mutationCount++;
    // MUTATION — same reference, OnPush child won't re-render!
    this.user.name = `Mutated #${this.mutationCount} (stale!)`;
    // user variable still points to the same object, Angular OnPush skips it
  }

  spreadGood() {
    this.user = { ...this.user, name: `Bob (updated)`, age: this.user.age + 1 };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ManualCDComponent — ChangeDetectorRef.markForCheck() / detectChanges()
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-manual-cd',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="padding:1.5rem; background:#e8eaf6; border-radius:8px; margin-bottom:1rem">
      <h3>ChangeDetectorRef — markForCheck() & detectChanges()</h3>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem">
        <!-- Without markForCheck -->
        <div style="background:white; padding:0.75rem; border-radius:4px">
          <strong>Without markForCheck</strong>
          <p style="margin:0.4rem 0">Value: {{ withoutMark }}</p>
          <button (click)="updateWithout()"
                  style="padding:0.3rem 0.75rem; background:#c62828; color:white; border:none; border-radius:4px; cursor:pointer">
            Update (won't show)
          </button>
          <p style="font-size:0.8rem; color:#e65100; margin-top:0.4rem">
            setTimeout update won't trigger OnPush re-render!
          </p>
        </div>

        <!-- With markForCheck -->
        <div style="background:white; padding:0.75rem; border-radius:4px">
          <strong>With markForCheck()</strong>
          <p style="margin:0.4rem 0">Value: {{ withMark }}</p>
          <button (click)="updateWith()"
                  style="padding:0.3rem 0.75rem; background:#2e7d32; color:white; border:none; border-radius:4px; cursor:pointer">
            Update + markForCheck
          </button>
          <p style="font-size:0.8rem; color:#2e7d32; margin-top:0.4rem">
            markForCheck() schedules this component for next CD cycle. ✓
          </p>
        </div>
      </div>

      <div style="margin-top:0.75rem; font-size:0.85rem; background:#e8eaf6; padding:0.75rem; border-radius:4px">
        <code>markForCheck()</code> — tells Angular: "check this component in the next CD run".<br/>
        <code>detectChanges()</code> — runs CD synchronously right now (use sparingly).<br/>
        With signals: neither is needed — signals automatically track + mark dirty.
      </div>
    </div>
  `,
})
export class ManualCDComponent {
  private cdr = inject(ChangeDetectorRef);
  withoutMark = 'initial';
  withMark    = 'initial';

  updateWithout() {
    setTimeout(() => {
      this.withoutMark = 'updated (but view is stale)';
      // No markForCheck → OnPush won't re-render
    }, 500);
  }

  updateWith() {
    setTimeout(() => {
      this.withMark = 'updated & view is fresh!';
      this.cdr.markForCheck();  // schedules re-check
    }, 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. OnPushWithSignals — signals always work with OnPush
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-onpush-signals',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="padding:1.5rem; background:#e8f5e9; border-radius:8px; margin-bottom:1rem">
      <h3>OnPush + Signals (Always Works!)</h3>
      <p style="font-size:0.9rem; color:#555">
        Signals automatically mark the view dirty when they change — even with OnPush.
        No need for markForCheck()!
      </p>
      <div style="font-size:2.5rem; font-weight:bold; text-align:center; margin:0.5rem 0">
        {{ count() }}
      </div>
      <div style="display:flex; gap:0.5rem; justify-content:center">
        <button (click)="count.update(c => c - 1)"
                style="padding:0.4rem 1rem; background:#c62828; color:white; border:none; border-radius:4px; cursor:pointer">
          −1
        </button>
        <button (click)="count.update(c => c + 1)"
                style="padding:0.4rem 1rem; background:#2e7d32; color:white; border:none; border-radius:4px; cursor:pointer">
          +1
        </button>
      </div>
      <p style="text-align:center; font-size:0.85rem; margin-top:0.5rem; color:#666">
        Render count: {{ renderCount() }}
        (only increments on signal change, not on parent ticks)
      </p>
    </div>
  `,
})
export class OnPushWithSignalsComponent {
  count       = signal(0);
  renderCount = signal(0);

  constructor() {
    // Simulated: in real app you'd use effect() to count renders
  }

  ngDoCheck() { this.renderCount.update(n => n + 1); }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. PureComponentDemo — Default vs OnPush re-render comparison
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-default-counter',
  standalone: true,
  // Default strategy — re-renders on every parent CD cycle
  template: `
    <div style="background:#ffcdd2; padding:0.5rem; border-radius:4px">
      <strong>Default Strategy</strong><br/>
      Renders: <strong>{{ renderCount }}</strong>
      <button (click)="localCount++" style="margin-left:0.5rem; padding:0.2rem 0.5rem; cursor:pointer">
        +{{ localCount }}
      </button>
    </div>
  `,
})
export class DefaultCounterComponent {
  renderCount = 0;
  localCount  = 0;
  ngDoCheck() { this.renderCount++; }
}

@Component({
  selector: 'app-onpush-counter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="background:#c8e6c9; padding:0.5rem; border-radius:4px">
      <strong>OnPush + Signal</strong><br/>
      Renders: <strong>{{ renderCount() }}</strong>
      <button (click)="localCount.update(c=>c+1)" style="margin-left:0.5rem; padding:0.2rem 0.5rem; cursor:pointer">
        +{{ localCount() }}
      </button>
    </div>
  `,
})
export class OnPushCounterComponent {
  renderCount = signal(0);
  localCount  = signal(0);
  ngDoCheck() { this.renderCount.update(n => n + 1); }
}

@Component({
  selector: 'app-pure-demo',
  standalone: true,
  imports: [DefaultCounterComponent, OnPushCounterComponent],
  template: `
    <div style="padding:1.5rem; background:#fafafa; border:1px solid #ddd; border-radius:8px; margin-bottom:1rem">
      <h3>Default vs OnPush — Render Count Comparison</h3>

      <p style="font-size:0.9rem; color:#555">
        Parent timer ticks every second (irrelevant update).
        Watch how Default re-renders on every tick; OnPush only re-renders when its own data changes.
      </p>

      <div style="text-align:center; font-size:1.5rem; margin:0.5rem 0">
        Parent ticks: <strong>{{ ticks() }}</strong>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-top:0.75rem">
        <app-default-counter />
        <app-onpush-counter />
      </div>

      <p style="font-size:0.85rem; color:#666; margin-top:0.75rem">
        Best practice: use <code>ChangeDetectionStrategy.OnPush</code> for all components,
        and use signals for local state. This dramatically reduces unnecessary re-renders.
      </p>
    </div>
  `,
})
export class PureDemoComponent implements OnInit, OnDestroy {
  ticks      = signal(0);
  private id = 0;

  ngOnInit() {
    this.id = setInterval(() => this.ticks.update(t => t + 1), 1000) as unknown as number;
  }

  ngOnDestroy() { clearInterval(this.id); }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MutationDemoComponent,
    ManualCDComponent,
    OnPushWithSignalsComponent,
    PureDemoComponent,
  ],
  template: `
    <div style="font-family:sans-serif; max-width:800px; margin:2rem auto; padding:0 1rem">
      <h1>Phase 6 – Change Detection</h1>
      <app-mutation-demo />
      <app-manual-cd />
      <app-onpush-signals />
      <app-pure-demo />
      <div style="padding:1rem; background:#f5f5f5; border-radius:8px; font-size:0.85rem">
        <strong>Change Detection Cheat Sheet:</strong>
        <ul>
          <li><code>ChangeDetectionStrategy.OnPush</code> — component only checks when inputs change (by reference), events fire, or observables emit</li>
          <li>Mutation bug: <code>obj.prop = val</code> won't trigger OnPush; use spread: <code>&#123; ...obj, prop: val &#125;</code></li>
          <li><code>cdr.markForCheck()</code> — schedule this + ancestors for next CD cycle</li>
          <li><code>cdr.detectChanges()</code> — run CD synchronously for this subtree</li>
          <li>Signals + OnPush — best combo; signals auto-track, no markForCheck needed</li>
          <li><code>async</code> pipe + OnPush — works perfectly, auto-unsubscribes too</li>
        </ul>
      </div>
    </div>
  `,
})
export class AppComponent {}
