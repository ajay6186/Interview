// Phase 6 - Solution 04: Performance Optimizations
// Topics: TrackBy, pure pipes, OnPush, virtual scrolling, deferrable views, NgOptimizedImage

import {
  Component, signal, Pipe, PipeTransform,
  ChangeDetectionStrategy, OnInit, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';

// ─────────────────────────────────────────────────────────────────────────────
// 1. TrackBy demo
// ─────────────────────────────────────────────────────────────────────────────

interface ListItem { id: number; name: string; value: number; }

@Component({
  selector: 'app-trackby-demo',
  standalone: true,
  template: `
    <div style="padding:1.5rem; background:#e8f5e9; border-radius:8px; margin-bottom:1rem">
      <h3>TrackBy Best Practices</h3>

      <div style="display:flex; gap:0.5rem; margin-bottom:0.75rem; flex-wrap:wrap">
        <button (click)="shuffle()" style="padding:0.4rem 0.75rem; background:#2e7d32; color:white; border:none; border-radius:4px; cursor:pointer">
          Shuffle List
        </button>
        <button (click)="addItem()" style="padding:0.4rem 0.75rem; background:#1565c0; color:white; border:none; border-radius:4px; cursor:pointer">
          Add Item
        </button>
        <button (click)="removeFirst()" style="padding:0.4rem 0.75rem; background:#c62828; color:white; border:none; border-radius:4px; cursor:pointer">
          Remove First
        </button>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem">
        <!-- Without track — recreates all DOM nodes -->
        <div>
          <strong style="color:#c62828">Without track (BAD)</strong>
          <div style="font-size:0.8rem; color:#888; margin-bottom:0.4rem">All DOM nodes recreated on shuffle</div>
          <div style="height:150px; overflow-y:auto; background:white; border-radius:4px">
            @for (item of items(); track $index) {
              <div style="padding:0.3rem 0.5rem; border-bottom:1px solid #f0f0f0; font-size:0.85rem">
                {{ item.id }}: {{ item.name }}
              </div>
            }
          </div>
        </div>

        <!-- With track item.id — only reorders existing DOM nodes -->
        <div>
          <strong style="color:#2e7d32">With track item.id (GOOD)</strong>
          <div style="font-size:0.8rem; color:#888; margin-bottom:0.4rem">DOM nodes reused, only reordered</div>
          <div style="height:150px; overflow-y:auto; background:white; border-radius:4px">
            @for (item of items(); track item.id) {
              <div style="padding:0.3rem 0.5rem; border-bottom:1px solid #f0f0f0; font-size:0.85rem">
                {{ item.id }}: {{ item.name }}
              </div>
            }
          </div>
        </div>
      </div>

      <div style="margin-top:0.75rem; font-size:0.85rem; background:#f1f8e9; padding:0.75rem; border-radius:4px">
        <strong>Angular 17 @for requires track (compiler warning if omitted):</strong><br/>
        <code>@for (item of items; track item.id)</code> — use a unique, stable ID<br/>
        <code>@for (item of items; track $index)</code> — last resort; defeats track purpose<br/>
        <br/>
        <strong>Old *ngFor syntax:</strong><br/>
        <code>*ngFor="let item of items; trackBy: trackById"</code><br/>
        <code>trackById(index: number, item: Item) &#123; return item.id; &#125;</code>
      </div>
    </div>
  `,
})
export class TrackByDemoComponent {
  private nextId = 11;
  items = signal<ListItem[]>(
    Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}`, value: Math.random() }))
  );

  shuffle() {
    this.items.update(arr => [...arr].sort(() => Math.random() - 0.5));
  }

  addItem() {
    this.items.update(arr => [...arr, { id: this.nextId++, name: `Item ${this.nextId - 1}`, value: Math.random() }]);
  }

  removeFirst() {
    this.items.update(arr => arr.slice(1));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. @defer — deferrable views
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-heavy',
  standalone: true,
  template: `
    <div style="padding:0.75rem; background:#e3f2fd; border-radius:4px">
      <strong>Heavy Component</strong> — Loaded on demand!
      <p style="margin:0.25rem 0 0; font-size:0.85rem">
        In a real app this could be a chart library, map, or complex data grid.
      </p>
    </div>
  `,
})
export class HeavyComponent {}

@Component({
  selector: 'app-defer-demo',
  standalone: true,
  imports: [HeavyComponent],
  template: `
    <div style="padding:1.5rem; background:#fff3e0; border-radius:8px; margin-bottom:1rem">
      <h3>&#64;defer — Deferrable Views</h3>

      <div style="display:flex; gap:0.5rem; margin-bottom:0.75rem">
        <button (click)="showOnIdle.set(true)"
                style="padding:0.4rem 0.75rem; background:#e65100; color:white; border:none; border-radius:4px; cursor:pointer">
          Load (when condition)
        </button>
        <button (click)="showOnIdle.set(false)"
                style="padding:0.4rem 0.75rem; background:#555; color:white; border:none; border-radius:4px; cursor:pointer">
          Unload
        </button>
      </div>

      <!-- @defer with @placeholder, @loading, @error blocks -->
      @defer (when showOnIdle()) {
        <app-heavy />
      } @placeholder {
        <div style="padding:0.5rem; background:#f5f5f5; border:2px dashed #ccc; border-radius:4px; color:#888">
          Placeholder — shown before defer block is triggered
        </div>
      } @loading (minimum 300ms) {
        <div style="padding:0.5rem; background:#fff8e1; border-radius:4px; color:#e65100">
          Loading heavy component...
        </div>
      } @error {
        <div style="padding:0.5rem; background:#ffebee; border-radius:4px; color:#c62828">
          Failed to load component
        </div>
      }

      <div style="margin-top:1rem; font-size:0.85rem; background:#fff8e1; padding:0.75rem; border-radius:4px">
        <strong>@defer triggers:</strong>
        <ul style="margin:0.5rem 0 0; padding-left:1.25rem">
          <li><code>@defer (on viewport)</code> — when block scrolls into view</li>
          <li><code>@defer (on interaction)</code> — on first click/focus/touch</li>
          <li><code>@defer (on hover)</code> — on hover</li>
          <li><code>@defer (on idle)</code> — when browser is idle (requestIdleCallback)</li>
          <li><code>@defer (on timer(2s))</code> — after a delay</li>
          <li><code>@defer (when condition)</code> — when expression is true</li>
          <li><code>@defer (prefetch on idle)</code> — prefetch chunk but defer rendering</li>
        </ul>
        <p style="margin:0.5rem 0 0">
          @defer only works with <code>loadComponent</code> in lazy routes or in the same
          compilation unit — the component is still imported, but the rendering is deferred.
        </p>
      </div>
    </div>
  `,
})
export class DeferDemoComponent {
  showOnIdle = signal(false);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Pure vs Impure Pipe
// ─────────────────────────────────────────────────────────────────────────────

@Pipe({ name: 'impureRandom', pure: false, standalone: true })
export class ImpureRandomPipe implements PipeTransform {
  private callCount = 0;
  transform(_value: number): string {
    this.callCount++;
    return `${(Math.random() * 100).toFixed(2)} [called ${this.callCount} times]`;
  }
}

@Pipe({ name: 'currency2', pure: true, standalone: true })
export class PureCurrencyPipe implements PipeTransform {
  private callCount = 0;
  transform(value: number, currency = 'USD'): string {
    this.callCount++;
    return `${currency} ${value.toFixed(2)} [called ${this.callCount} times]`;
  }
}

@Component({
  selector: 'app-pipe-demo',
  standalone: true,
  imports: [ImpureRandomPipe, PureCurrencyPipe],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div style="padding:1.5rem; background:#f3e5f5; border-radius:8px; margin-bottom:1rem">
      <h3>Pure vs Impure Pipes</h3>

      <div style="margin-bottom:0.75rem">
        <button (click)="tick()" style="padding:0.4rem 0.75rem; background:#7b1fa2; color:white; border:none; border-radius:4px; cursor:pointer; margin-right:0.5rem">
          Tick CD ({{ cdCount }} times)
        </button>
        <button (click)="changeInput()" style="padding:0.4rem 0.75rem; background:#1565c0; color:white; border:none; border-radius:4px; cursor:pointer">
          Change Input ({{ inputValue }})
        </button>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; font-size:0.9rem">
        <div style="background:white; padding:0.75rem; border-radius:4px">
          <strong style="color:#c62828">Impure Pipe (pure: false)</strong>
          <p style="margin:0.4rem 0; font-size:0.85rem">Runs on EVERY CD cycle:</p>
          <code>{{ inputValue | impureRandom }}</code>
        </div>
        <div style="background:white; padding:0.75rem; border-radius:4px">
          <strong style="color:#2e7d32">Pure Pipe (pure: true)</strong>
          <p style="margin:0.4rem 0; font-size:0.85rem">Runs only when input changes:</p>
          <code>{{ inputValue | currency2 }}</code>
        </div>
      </div>

      <div style="margin-top:0.75rem; font-size:0.85rem; background:#f8f4ff; padding:0.75rem; border-radius:4px">
        <strong>Pure pipe memoizes:</strong> same input → returns cached result without re-computing.<br/>
        <strong>Use impure pipes only for:</strong> Date.now(), Math.random(), mutable collections.<br/>
        <strong>Angular default:</strong> <code>pure: true</code>. Performance-sensitive transforms should always be pure.
      </div>
    </div>
  `,
})
export class PipeDemoComponent {
  cdCount    = 0;
  inputValue = 42;

  tick()        { this.cdCount++; }
  changeInput() { this.inputValue += 10; }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Virtual Scrolling (CdkVirtualScrollViewport)
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-virtual-scroll-demo',
  standalone: true,
  template: `
    <div style="padding:1.5rem; background:#e0f2f1; border-radius:8px; margin-bottom:1rem">
      <h3>Virtual Scrolling (CdkVirtualScrollViewport)</h3>
      <p style="font-size:0.9rem; color:#555">
        {{ items.length.toLocaleString() }} items — only visible rows are in the DOM.
        Install: <code>npm install @angular/cdk</code>
      </p>

      <!--
        REAL IMPLEMENTATION:
        Import ScrollingModule from '@angular/cdk/scrolling'

        <cdk-virtual-scroll-viewport itemSize="40" style="height:300px; border:1px solid #ccc; border-radius:4px">
          <div *cdkVirtualFor="let item of items; trackBy: trackById"
               style="height:40px; padding:0.5rem; border-bottom:1px solid #eee; display:flex; align-items:center">
            {{ item.id }}: {{ item.name }}
          </div>
        </cdk-virtual-scroll-viewport>

        itemSize: height of each item in px (fixed size required for basic usage)
        *cdkVirtualFor: replaces *ngFor inside the viewport
        Only renders items in view + a small overscan buffer (~2 screens worth)
      -->

      <!-- Demo: regular overflow scroll with 20 items to show the concept -->
      <div style="height:200px; overflow-y:auto; border:1px solid #80cbc4; border-radius:4px; background:white">
        @for (item of items.slice(0, 20); track item.id) {
          <div style="padding:0.5rem; border-bottom:1px solid #f0f0f0; font-size:0.85rem; height:36px; display:flex; align-items:center">
            <span style="color:#888; margin-right:0.5rem; min-width:50px">#{{ item.id }}</span>
            {{ item.name }}
          </div>
        }
        <div style="padding:1rem; text-align:center; color:#888; font-style:italic">
          + {{ items.length - 20 }} more items (use CdkVirtualScrollViewport for these)
        </div>
      </div>

      <div style="margin-top:0.75rem; font-size:0.85rem; background:#e0f7fa; padding:0.75rem; border-radius:4px">
        <strong>When to use virtual scrolling:</strong> lists with 100+ items. <br/>
        <strong>itemSize</strong> must be fixed for CdkFixedSizeVirtualScrollStrategy (default).<br/>
        For variable-height items use CdkVirtualScrollableWindow or AutoSizeVirtualScrollStrategy.
      </div>
    </div>
  `,
})
export class VirtualScrollDemoComponent {
  items = Array.from({ length: 10000 }, (_, i) => ({
    id: i + 1,
    name: `Generated item #${i + 1}`,
  }));

  trackById(_: number, item: { id: number }) { return item.id; }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. NgOptimizedImage
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-optimized-image-demo',
  standalone: true,
  template: `
    <div style="padding:1.5rem; background:#fce4ec; border-radius:8px; margin-bottom:1rem">
      <h3>NgOptimizedImage</h3>

      <div style="font-size:0.9rem; color:#555; margin-bottom:0.75rem">
        Import: <code>import &#123; NgOptimizedImage &#125; from '@angular/common';</code>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; font-size:0.85rem">
        <div style="background:white; padding:0.75rem; border-radius:4px">
          <strong style="color:#c62828">Regular img (BAD)</strong>
          <pre style="margin:0.4rem 0; font-size:0.75rem; background:#f5f5f5; padding:0.5rem; border-radius:3px">{{ badImg }}</pre>
          Problems:
          <ul style="margin:0.25rem 0; padding-left:1rem">
            <li>No lazy loading by default</li>
            <li>No width/height → CLS (Cumulative Layout Shift)</li>
            <li>No automatic srcset for responsive images</li>
          </ul>
        </div>

        <div style="background:white; padding:0.75rem; border-radius:4px">
          <strong style="color:#2e7d32">NgOptimizedImage (GOOD)</strong>
          <pre style="margin:0.4rem 0; font-size:0.75rem; background:#f5f5f5; padding:0.5rem; border-radius:3px">{{ goodImg }}</pre>
          Benefits:
          <ul style="margin:0.25rem 0; padding-left:1rem">
            <li><code>loading="lazy"</code> by default</li>
            <li>Enforces width + height (prevents CLS)</li>
            <li>Auto-generates srcset for responsiveness</li>
            <li>Dev-mode warnings for wrong sizes</li>
            <li><code>priority</code> adds LCP preload link</li>
          </ul>
        </div>
      </div>

      <div style="margin-top:0.75rem; font-size:0.85rem; background:#fce4ec; padding:0.75rem; border-radius:4px">
        <strong>Loaders:</strong> Works with CDN providers out of the box:
        <code>provideImgixLoader()</code>,
        <code>provideCloudinaryLoader()</code>,
        <code>provideImageKitLoader()</code>,
        or custom loader function.
      </div>
    </div>
  `,
})
export class NgOptimizedImageDemoComponent {
  badImg = `<!-- Bad: no lazy loading, no dimensions -->
<img src="hero.jpg" />`;

  goodImg = `<!-- Good: optimized -->
<img ngSrc="hero.jpg"
     width="800" height="600"
     priority />        <!-- LCP image -->

<img ngSrc="card.jpg"
     width="400" height="300" />
     <!-- lazy by default, auto srcset -->

<!-- With CDN loader in providers:
  provideImgixLoader('https://cdn.example.com')
  Then: ngSrc is the image path, loader adds params -->`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    TrackByDemoComponent,
    DeferDemoComponent,
    PipeDemoComponent,
    VirtualScrollDemoComponent,
    NgOptimizedImageDemoComponent,
  ],
  template: `
    <div style="font-family:sans-serif; max-width:900px; margin:2rem auto; padding:0 1rem">
      <h1>Phase 6 – Performance Optimizations</h1>
      <app-trackby-demo />
      <app-defer-demo />
      <app-pipe-demo />
      <app-virtual-scroll-demo />
      <app-optimized-image-demo />
    </div>
  `,
})
export class AppComponent {}
