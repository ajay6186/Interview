import { Component, signal, computed, inject, NgZone, OnInit, OnDestroy, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';

// ============================================================
// Examples 7.3 — Angular Performance Optimization (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. NgOptimizedImage basic [ngSrc]
@Component({
  selector: 'ex-01', standalone: true,
  imports: [NgOptimizedImage],
  template: `
    <p>NgOptimizedImage automatically sets loading="lazy", decoding="async", and adds width/height to prevent CLS.</p>
    <pre style="background:#f4f4f4;padding:8px;font-size:12px">&lt;img ngSrc="https://placekitten.com/300/200" width="300" height="200" alt="Cat" /&gt;</pre>
  `
})
class Ex01 {}

// 2. NgOptimizedImage fill mode
@Component({
  selector: 'ex-02', standalone: true,
  imports: [NgOptimizedImage],
  template: `
    <p><code>fill</code> mode: image fills its parent container. Parent must have <code>position: relative</code> and defined dimensions.</p>
    <div style="position:relative;width:200px;height:120px;background:#eee;overflow:hidden">
      <img ngSrc="https://picsum.photos/200/120" fill alt="Fill demo" style="object-fit:cover" />
    </div>
  `
})
class Ex02 {}

// 3. NgOptimizedImage priority (above fold)
@Component({
  selector: 'ex-03', standalone: true,
  imports: [NgOptimizedImage],
  template: `
    <p><code>priority</code> attribute disables lazy loading and adds <code>fetchpriority="high"</code> for LCP images above the fold.</p>
    <pre style="background:#f4f4f4;padding:8px;font-size:12px">&lt;img ngSrc="hero.jpg" width="1200" height="400" priority alt="Hero" /&gt;</pre>
  `
})
class Ex03 {}

// 4. NgOptimizedImage with width + height
@Component({
  selector: 'ex-04', standalone: true,
  imports: [NgOptimizedImage],
  template: `
    <p>Always specify <code>width</code> and <code>height</code> with NgOptimizedImage to prevent Cumulative Layout Shift (CLS).</p>
    <img ngSrc="https://picsum.photos/150/100" width="150" height="100" alt="Sized image" />
  `
})
class Ex04 {}

// 5. @defer basic
@Component({
  selector: 'ex-05', standalone: true,
  template: `
    <p>Basic @defer: deferred block loads lazily on idle by default.</p>
    @defer {
      <div style="background:#e8f5e9;padding:8px;border-radius:4px">Deferred content loaded!</div>
    }
  `
})
class Ex05 {}

// 6. @defer on:viewport
@Component({
  selector: 'ex-06', standalone: true,
  template: `
    <p>@defer on:viewport — loads when the placeholder enters the viewport.</p>
    @defer (on viewport) {
      <div style="background:#e3f2fd;padding:8px;border-radius:4px">Content loaded on viewport entry</div>
    } @placeholder {
      <div style="background:#f5f5f5;padding:8px;border-radius:4px;color:#999">Scroll to load...</div>
    }
  `
})
class Ex06 {}

// 7. @defer on:idle
@Component({
  selector: 'ex-07', standalone: true,
  template: `
    <p>@defer on:idle — waits for browser idle time (requestIdleCallback) before loading.</p>
    @defer (on idle) {
      <div style="background:#fff3e0;padding:8px;border-radius:4px">Loaded after browser became idle</div>
    } @placeholder {
      <div style="color:#999">Waiting for idle...</div>
    }
  `
})
class Ex07 {}

// 8. @defer on:interaction
@Component({
  selector: 'ex-08', standalone: true,
  template: `
    <p>@defer on:interaction — loads on first click/keydown on the trigger element.</p>
    @defer (on interaction(trigger)) {
      <div style="background:#fce4ec;padding:8px;border-radius:4px;margin-top:8px">Loaded after interaction!</div>
    } @placeholder {
      <button #trigger>Click me to load deferred content</button>
    }
  `
})
class Ex08 {}

// 9. @defer with @loading block
@Component({
  selector: 'ex-09', standalone: true,
  template: `
    <p>@loading block shown while deferred content is being fetched.</p>
    @defer (on idle) {
      <div style="background:#e8f5e9;padding:8px">Fully loaded content</div>
    } @loading (minimum 500ms) {
      <div style="color:#999;font-style:italic">Loading...</div>
    }
  `
})
class Ex09 {}

// 10. @defer with @placeholder block
@Component({
  selector: 'ex-10', standalone: true,
  template: `
    <p>@placeholder is shown before deferred loading starts. Use <code>minimum</code> to prevent flicker.</p>
    @defer (on interaction(btn)) {
      <div style="background:#e3f2fd;padding:8px">Deferred content ready</div>
    } @placeholder (minimum 300ms) {
      <button #btn style="cursor:pointer">Tap to load</button>
    }
  `
})
class Ex10 {}

// 11. @defer with @error block
@Component({
  selector: 'ex-11', standalone: true,
  template: `
    <p>@error block is shown if deferred loading fails (e.g., lazy-loaded module fails to fetch).</p>
    @defer {
      <div style="background:#e8f5e9;padding:8px">Content loaded successfully</div>
    } @error {
      <div style="background:#ffebee;padding:8px;color:#c62828">Failed to load content. Please retry.</div>
    }
  `
})
class Ex11 {}

// 12. @defer when(signal condition)
@Component({
  selector: 'ex-12', standalone: true,
  template: `
    <button (click)="ready.set(true)">Mark Ready</button>
    <p>Ready: {{ ready() }}</p>
    @defer (when ready()) {
      <div style="background:#f3e5f5;padding:8px;margin-top:8px">Signal-triggered deferred content!</div>
    } @placeholder {
      <div style="color:#999">Waiting for signal...</div>
    }
  `
})
class Ex12 {
  ready = signal(false);
}

// 13. @defer prefetch on:hover
@Component({
  selector: 'ex-13', standalone: true,
  template: `
    <p>Prefetch starts on hover, but renders on click. Reduces perceived load time.</p>
    @defer (on interaction(btn); prefetch on hover(btn)) {
      <div style="background:#e8eaf6;padding:8px;margin-top:8px">Prefetched + rendered on click!</div>
    } @placeholder {
      <button #btn>Hover to prefetch, click to show</button>
    }
  `
})
class Ex13 {}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────

// 14. @defer prefetch on:idle
@Component({
  selector: 'ex-14', standalone: true,
  template: `
    <p>Prefetch on idle: browser preloads the chunk during idle time, renders on interaction.</p>
    @defer (on interaction(btn); prefetch on idle) {
      <div style="background:#e0f7fa;padding:8px;margin-top:8px">Idle-prefetched content</div>
    } @placeholder {
      <button #btn>Show prefetched content</button>
    }
  `
})
class Ex14 {}

// 15. @defer with timer trigger (after 2s)
@Component({
  selector: 'ex-15', standalone: true,
  template: `
    <p>@defer with <code>on timer(2s)</code> — loads automatically after 2 seconds.</p>
    @defer (on timer(2000ms)) {
      <div style="background:#f9fbe7;padding:8px;border-radius:4px">Loaded after 2-second timer!</div>
    } @placeholder {
      <div style="color:#999">Auto-loading in 2 seconds...</div>
    }
  `
})
class Ex15 {}

// 16. NgOptimizedImage with srcset (ngSrcset)
@Component({
  selector: 'ex-16', standalone: true,
  imports: [NgOptimizedImage],
  template: `
    <p><code>ngSrcset</code> generates a responsive srcset for serving correctly sized images at each breakpoint.</p>
    <img ngSrc="https://picsum.photos/400/200" ngSrcset="200w, 400w, 800w" width="400" height="200" alt="Responsive" sizes="(max-width:600px) 200px, 400px" />
  `
})
class Ex16 {}

// 17. NgOptimizedImage with image CDN (loaderParams)
@Component({
  selector: 'ex-17', standalone: true,
  imports: [NgOptimizedImage],
  template: `
    <p>CDN loaders (Cloudinary, ImageKit, etc.) use <code>[loaderParams]</code> for custom transforms. Without a custom loader, standard URL is used.</p>
    <pre style="background:#f4f4f4;padding:8px;font-size:12px">{{ code }}</pre>
  `
})
class Ex17 {
  code = `// With Cloudinary loader:
providers: [provideImageKitLoader('https://ik.imagekit.io/my-account')]

// In template:
<img ngSrc="photo.jpg" width="400" height="300"
     [loaderParams]="{ quality: 80, format: 'webp' }" />`;
}

// 18. trackBy in @for by id
@Component({
  selector: 'ex-18', standalone: true,
  template: `
    <p>@for with <code>track item.id</code> — Angular only re-renders items that changed, by comparing unique IDs.</p>
    @for (item of items(); track item.id) {
      <div style="padding:2px 0">{{ item.id }}: {{ item.name }}</div>
    }
    <button (click)="shuffle()">Shuffle</button>
  `
})
class Ex18 {
  items = signal([
    { id: 1, name: 'Alpha' }, { id: 2, name: 'Beta' }, { id: 3, name: 'Gamma' }
  ]);
  shuffle() { this.items.update(arr => [...arr].sort(() => Math.random() - 0.5)); }
}

// 19. trackBy by index fallback
@Component({
  selector: 'ex-19', standalone: true,
  template: `
    <p>Track by <code>$index</code> — useful when items have no stable ID. Less optimal than id tracking.</p>
    @for (item of items(); track $index) {
      <div style="padding:2px 0">{{ $index }}: {{ item }}</div>
    }
  `
})
class Ex19 {
  items = signal(['Apple', 'Banana', 'Cherry']);
}

// 20. OnPush + signal (no markForCheck)
@Component({
  selector: 'ex-20', standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p>OnPush + signals: signals automatically schedule change detection. No need for <code>markForCheck()</code>.</p>
    <p>Count: {{ count() }}</p>
    <button (click)="increment()">Increment</button>
  `
})
class Ex20 {
  count = signal(0);
  increment() { this.count.update(n => n + 1); }
}

// 21. Pure pipe optimization
@Component({
  selector: 'ex-21', standalone: true,
  template: `
    <p>Pure pipes only re-execute when input reference changes. Impure pipes run every CD cycle.</p>
    <pre style="background:#f4f4f4;padding:8px;font-size:12px">{{ code }}</pre>
  `
})
class Ex21 {
  code = `@Pipe({ name: 'expensive', pure: true }) // default is pure: true
export class ExpensivePipe implements PipeTransform {
  transform(value: string): string {
    return value.toUpperCase(); // only called when value reference changes
  }
}`;
}

// 22. Memoized computed() signal
@Component({
  selector: 'ex-22', standalone: true,
  template: `
    <p>computed() caches its value — only recalculates when dependencies change. Input: {{ baseValue() }}</p>
    <p>Computed (squared × filtered): {{ expensive() }}</p>
    <button (click)="baseValue.update(v => v + 1)">Increment</button>
  `
})
class Ex22 {
  baseValue = signal(5);
  expensive = computed(() => {
    const v = this.baseValue();
    return Array.from({ length: v }, (_, i) => i + 1).filter(n => n % 2 === 0).reduce((a, b) => a + b, 0);
  });
}

// 23. Avoid template function calls (use getters/computed)
@Component({
  selector: 'ex-23', standalone: true,
  template: `
    <p>BAD: <code>{{ badGetFullName() }}</code> — called every CD cycle</p>
    <p>GOOD: <code>{{ fullName() }}</code> — computed signal, only updates on dependency change</p>
  `
})
class Ex23 {
  firstName = signal('John');
  lastName = signal('Doe');
  fullName = computed(() => `${this.firstName()} ${this.lastName()}`);
  badGetFullName() { return `${this.firstName()} ${this.lastName()}`; }
}

// 24. Event delegation with single listener
@Component({
  selector: 'ex-24', standalone: true,
  template: `
    <p>Event delegation: one listener on parent handles all child clicks via <code>event.target</code>.</p>
    <ul (click)="onListClick($event)" style="cursor:pointer;list-style:none;padding:0">
      @for (item of items(); track item) {
        <li [attr.data-item]="item" style="padding:4px;border-bottom:1px solid #eee">{{ item }}</li>
      }
    </ul>
    <p>Clicked: {{ clicked() }}</p>
  `
})
class Ex24 {
  items = signal(['Item A', 'Item B', 'Item C', 'Item D']);
  clicked = signal('none');
  onListClick(event: Event) {
    const target = event.target as HTMLElement;
    const item = target.getAttribute('data-item');
    if (item) this.clicked.set(item);
  }
}

// 25. Bundle splitting via loadComponent
@Component({
  selector: 'ex-25', standalone: true,
  template: `
    <p>Lazy load a route component for bundle splitting — reduces initial bundle size.</p>
    <pre style="background:#f4f4f4;padding:8px;font-size:12px">{{ code }}</pre>
  `
})
class Ex25 {
  code = `// In app.routes.ts:
{
  path: 'dashboard',
  loadComponent: () =>
    import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
}`;
}

// 26. Preloading strategy selection
@Component({
  selector: 'ex-26', standalone: true,
  template: `
    <p>Preloading strategies control when lazy route chunks are downloaded.</p>
    <pre style="background:#f4f4f4;padding:8px;font-size:12px">{{ code }}</pre>
  `
})
class Ex26 {
  code = `// No preload (default):
provideRouter(routes)

// Preload all lazy routes after app loads:
provideRouter(routes, withPreloading(PreloadAllModules))

// Custom strategy (e.g. preload on data: { preload: true }):
provideRouter(routes, withPreloading(SelectivePreloadingStrategy))`;
}

// ─── NESTED (27–38) ──────────────────────────────────────────

// 27. @defer for below-fold section
@Component({
  selector: 'ex-27', standalone: true,
  template: `
    <p>Below-fold section deferred on viewport — doesn't block initial render.</p>
    @defer (on viewport) {
      <section style="background:#e8f5e9;padding:16px;border-radius:4px">
        <h3 style="margin:0 0 8px">Below-fold Content</h3>
        <p>Loaded only when user scrolls here.</p>
      </section>
    } @placeholder {
      <div style="background:#f5f5f5;padding:16px;text-align:center;color:#bbb">
        [ Below-fold section — loads on scroll ]
      </div>
    }
  `
})
class Ex27 {}

// 28. @defer for modal/overlay content
@Component({
  selector: 'ex-28', standalone: true,
  template: `
    <button (click)="open.set(true)">Open Modal</button>
    @defer (when open()) {
      <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border:1px solid #ccc;padding:24px;border-radius:8px;z-index:1000;box-shadow:0 4px 20px rgba(0,0,0,.2)">
        <strong>Deferred Modal Content</strong>
        <p>Heavy modal form or wizard loaded on demand.</p>
        <button (click)="open.set(false)">Close</button>
      </div>
    } @placeholder {
      <span></span>
    }
  `
})
class Ex28 {
  open = signal(false);
}

// 29. @defer for dashboard widget
@Component({
  selector: 'ex-29', standalone: true,
  template: `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      @for (widget of widgets(); track widget.id) {
        <div style="border:1px solid #e0e0e0;padding:12px;border-radius:4px">
          @defer (on viewport; prefetch on idle) {
            <div style="background:#e3f2fd;padding:8px;text-align:center">
              {{ widget.name }}<br/><small>{{ widget.value }}</small>
            </div>
          } @placeholder {
            <div style="background:#f5f5f5;padding:8px;text-align:center;color:#bbb">Loading widget...</div>
          }
        </div>
      }
    </div>
  `
})
class Ex29 {
  widgets = signal([
    { id: 1, name: 'Revenue', value: '$12,400' },
    { id: 2, name: 'Users', value: '3,210' },
    { id: 3, name: 'Orders', value: '842' },
    { id: 4, name: 'Growth', value: '+12.4%' },
  ]);
}

// 30. @defer for complex data table
@Component({
  selector: 'ex-30', standalone: true,
  template: `
    <button (click)="showTable.set(true)">Load Data Table</button>
    @defer (when showTable()) {
      <table style="width:100%;border-collapse:collapse;margin-top:8px">
        <tr style="background:#f5f5f5">
          <th style="padding:6px;border:1px solid #ddd">ID</th>
          <th style="padding:6px;border:1px solid #ddd">Name</th>
          <th style="padding:6px;border:1px solid #ddd">Status</th>
        </tr>
        @for (row of rows(); track row.id) {
          <tr>
            <td style="padding:6px;border:1px solid #ddd">{{ row.id }}</td>
            <td style="padding:6px;border:1px solid #ddd">{{ row.name }}</td>
            <td style="padding:6px;border:1px solid #ddd">{{ row.status }}</td>
          </tr>
        }
      </table>
    } @placeholder {
      <p style="color:#999">Table not loaded yet</p>
    }
  `
})
class Ex30 {
  showTable = signal(false);
  rows = signal([
    { id: 1, name: 'Alice', status: 'Active' },
    { id: 2, name: 'Bob', status: 'Inactive' },
    { id: 3, name: 'Carol', status: 'Active' },
  ]);
}

// 31. @defer for chart/visualization
@Component({
  selector: 'ex-31', standalone: true,
  template: `
    <p>Chart deferred on viewport — heavy D3/Chart.js won't block page load.</p>
    @defer (on viewport; prefetch on idle) {
      <div style="background:#1a237e;padding:16px;border-radius:4px;color:#fff;text-align:center">
        📊 Chart Loaded<br/>
        <div style="display:flex;gap:4px;justify-content:center;align-items:flex-end;height:60px;margin-top:8px">
          @for (bar of bars(); track $index) {
            <div [style.height.px]="bar" [style.width.px]="20" style="background:#90caf9;border-radius:2px 2px 0 0"></div>
          }
        </div>
      </div>
    } @placeholder {
      <div style="background:#f5f5f5;padding:32px;text-align:center;color:#bbb;border-radius:4px">[ Chart placeholder ]</div>
    }
  `
})
class Ex31 {
  bars = signal([20, 45, 30, 60, 40, 55, 35]);
}

// 32. @defer for third-party script widget
@Component({
  selector: 'ex-32', standalone: true,
  template: `
    <p>Third-party widgets (chat, maps, ads) deferred on idle to not block main thread.</p>
    @defer (on idle) {
      <div style="background:#fff8e1;padding:12px;border-radius:4px;border:1px solid #ffe082">
        <strong>💬 Chat Widget</strong><br/>
        <small>Third-party script loaded after browser idle</small>
      </div>
    } @placeholder {
      <div style="color:#bbb;font-size:13px">Chat loading...</div>
    }
  `
})
class Ex32 {}

// 33. Staggered loading with multiple @defer blocks
@Component({
  selector: 'ex-33', standalone: true,
  template: `
    <p>Staggered loading: different sections use different defer triggers.</p>
    <div style="display:grid;gap:8px">
      @defer (on idle) {
        <div style="background:#e8f5e9;padding:8px;border-radius:4px">Section 1: Loaded on idle</div>
      } @placeholder { <div style="background:#f5f5f5;padding:8px">Section 1...</div> }
      @defer (on timer(500ms)) {
        <div style="background:#e3f2fd;padding:8px;border-radius:4px">Section 2: Loaded after 500ms</div>
      } @placeholder { <div style="background:#f5f5f5;padding:8px">Section 2...</div> }
      @defer (on viewport) {
        <div style="background:#fff3e0;padding:8px;border-radius:4px">Section 3: Loaded on viewport</div>
      } @placeholder { <div style="background:#f5f5f5;padding:8px">Section 3 (scroll)</div> }
    </div>
  `
})
class Ex33 {}

// 34. @defer + OnPush + signals combination
@Component({
  selector: 'ex-34', standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p>@defer + OnPush + signals: ultimate performance combo.</p>
    @defer (on idle) {
      <div style="background:#f3e5f5;padding:12px;border-radius:4px">
        <p>OnPush component count: {{ count() }}</p>
        <button (click)="count.update(n => n + 1)">Increment (signal-driven CD)</button>
      </div>
    } @placeholder {
      <div style="color:#999">Loading OnPush component...</div>
    }
  `
})
class Ex34 {
  count = signal(0);
}

// 35. NgOptimizedImage in a @for list
@Component({
  selector: 'ex-35', standalone: true,
  imports: [NgOptimizedImage],
  template: `
    <p>NgOptimizedImage in a list: each image is lazy-loaded with proper dimensions.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      @for (img of images(); track img.id) {
        <div>
          <img [ngSrc]="img.src" [width]="img.w" [height]="img.h" [alt]="img.alt"
               style="border-radius:4px;display:block" />
          <small>{{ img.alt }}</small>
        </div>
      }
    </div>
  `
})
class Ex35 {
  images = signal([
    { id: 1, src: 'https://picsum.photos/seed/a/80/60', w: 80, h: 60, alt: 'Pic 1' },
    { id: 2, src: 'https://picsum.photos/seed/b/80/60', w: 80, h: 60, alt: 'Pic 2' },
    { id: 3, src: 'https://picsum.photos/seed/c/80/60', w: 80, h: 60, alt: 'Pic 3' },
  ]);
}

// 36. NgOptimizedImage with AVIF/WebP format hint
@Component({
  selector: 'ex-36', standalone: true,
  imports: [NgOptimizedImage],
  template: `
    <p>Modern image formats (AVIF/WebP) via CDN loader — NgOptimizedImage handles format negotiation automatically with supported loaders.</p>
    <pre style="background:#f4f4f4;padding:8px;font-size:12px">{{ code }}</pre>
  `
})
class Ex36 {
  code = `// With ImageKit loader, format is auto-negotiated:
<img ngSrc="photo.jpg" width="800" height="600"
     [loaderParams]="{ format: 'auto' }" />
// Serves AVIF to AVIF-capable browsers, WebP otherwise.`;
}

// 37. Performance monitoring (PerformanceObserver)
@Component({
  selector: 'ex-37', standalone: true,
  template: `
    <p>PerformanceObserver tracks LCP, FCP, CLS, and FID in the browser.</p>
    <button (click)="observe()">Start Observing</button>
    <div style="margin-top:8px;font-family:monospace;font-size:12px">
      @for (entry of entries(); track $index) {
        <div>{{ entry }}</div>
      }
    </div>
  `
})
class Ex37 {
  platformId = inject(PLATFORM_ID);
  entries = signal<string[]>([]);
  observe() {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.entries.update(e => [...e, `${entry.entryType}: ${entry.name} @ ${Math.round(entry.startTime)}ms`]);
        }
      }).observe({ type: 'navigation', buffered: true });
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries.length > 0) {
        const nav = navEntries[0] as PerformanceNavigationTiming;
        this.entries.set([
          `domContentLoaded: ${Math.round(nav.domContentLoadedEventEnd)}ms`,
          `loadEvent: ${Math.round(nav.loadEventEnd)}ms`,
        ]);
      }
    } catch {
      this.entries.set(['PerformanceObserver not available in this context']);
    }
  }
}

// 38. Full performance-optimized page layout
@Component({
  selector: 'ex-38', standalone: true,
  imports: [NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article style="border:1px solid #e0e0e0;border-radius:4px;overflow:hidden">
      <img ngSrc="https://picsum.photos/700/200" width="700" height="200" priority alt="Hero" style="width:100%;height:auto;display:block" />
      <div style="padding:12px">
        <h3 style="margin:0 0 8px">{{ title() }}</h3>
        <p style="margin:0 0 12px;color:#555">{{ summary() }}</p>
        @defer (on viewport) {
          <div style="background:#f5f5f5;padding:8px;border-radius:4px">
            <strong>Comments section (deferred on viewport)</strong>
            @for (c of comments(); track c.id) {
              <div style="padding:4px 0;border-bottom:1px solid #eee">{{ c.author }}: {{ c.text }}</div>
            }
          </div>
        } @placeholder {
          <div style="color:#bbb;padding:8px">Loading comments...</div>
        }
      </div>
    </article>
  `
})
class Ex38 {
  title = signal('Optimized Angular Page');
  summary = signal('Priority LCP image, OnPush CD, deferred comments section, signals-driven state.');
  comments = signal([
    { id: 1, author: 'Alice', text: 'Great post!' },
    { id: 2, author: 'Bob', text: 'Very helpful, thanks.' },
  ]);
}

// ─── ADVANCED (39–50) ────────────────────────────────────────

// 39. ngZone.runOutsideAngular for non-Angular work
@Component({
  selector: 'ex-39', standalone: true,
  template: `
    <p>runOutsideAngular prevents change detection for high-frequency events (scroll, mousemove, animations).</p>
    <button (click)="startTimer()">Start Outside-Zone Timer</button>
    <p>Ticks (no CD triggered): {{ ticks() }}</p>
  `
})
class Ex39 implements OnDestroy {
  ngZone = inject(NgZone);
  ticks = signal(0);
  private intervalId: ReturnType<typeof setInterval> | null = null;
  startTimer() {
    this.ngZone.runOutsideAngular(() => {
      this.intervalId = setInterval(() => {
        this.ticks.update(n => n + 1);
        if (this.ticks() >= 5 && this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
      }, 200);
    });
  }
  ngOnDestroy() { if (this.intervalId) clearInterval(this.intervalId); }
}

// 40. requestAnimationFrame outside zone
@Component({
  selector: 'ex-40', standalone: true,
  template: `
    <p>RAF outside zone: smooth 60fps animation without triggering Angular CD on every frame.</p>
    <div [style.width.px]="barWidth()" style="height:20px;background:#3f51b5;transition:none;border-radius:2px"></div>
    <button (click)="animate()" style="margin-top:8px">Animate</button>
  `
})
class Ex40 implements OnDestroy {
  ngZone = inject(NgZone);
  barWidth = signal(0);
  private rafId = 0;
  animate() {
    this.barWidth.set(0);
    this.ngZone.runOutsideAngular(() => {
      const step = () => {
        this.ngZone.run(() => {
          this.barWidth.update(w => Math.min(w + 5, 300));
        });
        if (this.barWidth() < 300) this.rafId = requestAnimationFrame(step);
      };
      this.rafId = requestAnimationFrame(step);
    });
  }
  ngOnDestroy() { cancelAnimationFrame(this.rafId); }
}

// 41. Web Workers communication pattern
@Component({
  selector: 'ex-41', standalone: true,
  template: `
    <p>Web Workers offload CPU-intensive tasks to a background thread.</p>
    <pre style="background:#f4f4f4;padding:8px;font-size:12px">{{ code }}</pre>
  `
})
class Ex41 {
  code = `// app.worker.ts:
addEventListener('message', ({ data }) => {
  const result = heavyComputation(data);
  postMessage(result);
});

// In component:
const worker = new Worker(new URL('./app.worker', import.meta.url));
worker.onmessage = ({ data }) => this.result.set(data);
worker.postMessage(inputData);`;
}

// 42. Zoneless setup concept
@Component({
  selector: 'ex-42', standalone: true,
  template: `
    <p>Zoneless Angular removes zone.js entirely — change detection driven purely by signals and explicit triggers.</p>
    <pre style="background:#f4f4f4;padding:8px;font-size:12px">{{ code }}</pre>
  `
})
class Ex42 {
  code = `// main.ts:
bootstrapApplication(AppComponent, {
  providers: [
    provideExperimentalZonelessChangeDetection(),
  ]
});
// No zone.js import in polyfills.
// All updates must go through signals or markForCheck().`;
}

// 43. Signal-based change detection (no zone.js)
@Component({
  selector: 'ex-43', standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p>Signal-only change detection: all state is signals, OnPush prevents any zone-based CD.</p>
    <p>Counter: {{ count() }} | Double: {{ double() }} | Even: {{ isEven() }}</p>
    <button (click)="count.update(n => n + 1)">+1</button>
  `
})
class Ex43 {
  count = signal(0);
  double = computed(() => this.count() * 2);
  isEven = computed(() => this.count() % 2 === 0 ? 'Yes' : 'No');
}

// 44. IntersectionObserver for lazy render
@Component({
  selector: 'ex-44', standalone: true,
  template: `
    <p>IntersectionObserver reveals content when it enters the viewport — manual lazy rendering.</p>
    <div #sentinel style="height:2px"></div>
    <div [style.display]="visible() ? 'block' : 'none'" style="background:#e8f5e9;padding:12px;border-radius:4px">
      Content is now visible!
    </div>
    @if (!visible()) {
      <p style="color:#bbb">Content hidden (not in viewport)</p>
    }
    <button (click)="startObserving()">Start Observer</button>
  `
})
class Ex44 implements OnDestroy {
  platformId = inject(PLATFORM_ID);
  visible = signal(false);
  private observer: IntersectionObserver | null = null;
  startObserving() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) { this.visible.set(true); this.observer?.disconnect(); }
    }, { threshold: 0.1 });
    const el = document.querySelector('[data-observe]');
    if (el) this.observer.observe(el);
    else this.visible.set(true);
  }
  ngOnDestroy() { this.observer?.disconnect(); }
}

// 45. ResizeObserver for responsive layout
@Component({
  selector: 'ex-45', standalone: true,
  template: `
    <p>ResizeObserver tracks element size changes for responsive components without media queries.</p>
    <div #box (mousedown)="startResize()" style="border:2px dashed #3f51b5;padding:16px;resize:horizontal;overflow:hidden;min-width:150px">
      Width: {{ boxWidth() }}px | Layout: <strong>{{ layout() }}</strong>
    </div>
    <button (click)="measureBox()" style="margin-top:8px">Measure Now</button>
  `
})
class Ex45 implements OnDestroy {
  platformId = inject(PLATFORM_ID);
  boxWidth = signal(0);
  layout = computed(() => this.boxWidth() > 400 ? 'Wide' : this.boxWidth() > 250 ? 'Medium' : 'Narrow');
  private observer: ResizeObserver | null = null;
  measureBox() {
    if (!isPlatformBrowser(this.platformId)) return;
    const el = document.querySelector('[data-resize-box]') ?? document.body;
    this.observer?.disconnect();
    this.observer = new ResizeObserver(entries => {
      this.boxWidth.set(Math.round(entries[0].contentRect.width));
    });
    this.observer.observe(el);
    this.boxWidth.set(el.getBoundingClientRect().width);
  }
  startResize() { this.measureBox(); }
  ngOnDestroy() { this.observer?.disconnect(); }
}

// 46. Service Worker registration concept
@Component({
  selector: 'ex-46', standalone: true,
  template: `
    <p>Service Workers enable offline caching and push notifications. Angular's @angular/pwa handles setup.</p>
    <pre style="background:#f4f4f4;padding:8px;font-size:12px">{{ code }}</pre>
  `
})
class Ex46 {
  code = `// ng add @angular/pwa
// app.config.ts:
provideServiceWorker('ngsw-worker.js', {
  enabled: !isDevMode(),
  registrationStrategy: 'registerWhenStable:30000'
})`;
}

// 47. Workbox precaching concept
@Component({
  selector: 'ex-47', standalone: true,
  template: `
    <p>Workbox (used by Angular PWA) precaches app shell assets so the app works offline.</p>
    <pre style="background:#f4f4f4;padding:8px;font-size:12px">{{ code }}</pre>
  `
})
class Ex47 {
  code = `// ngsw-config.json (Angular Service Worker config):
{
  "index": "/index.html",
  "assetGroups": [
    { "name": "app", "installMode": "prefetch",
      "resources": { "files": ["/favicon.ico", "/index.html", "/*.css", "/*.js"] } },
    { "name": "assets", "installMode": "lazy",
      "resources": { "files": ["/assets/**"] } }
  ]
}`;
}

// 48. CDN + HTTP/2 push concept
@Component({
  selector: 'ex-48', standalone: true,
  template: `
    <p>HTTP/2 Server Push preloads critical assets before browser requests them. CDN edge caches static files globally.</p>
    <pre style="background:#f4f4f4;padding:8px;font-size:12px">{{ code }}</pre>
  `
})
class Ex48 {
  code = `// Angular SSR server (Express):
app.get('/', (req, res) => {
  res.setHeader('Link',
    '</main.js>; rel=preload; as=script, </styles.css>; rel=preload; as=style'
  );
  res.sendFile('index.html');
});
// CDN: set long cache-control for hashed assets
// Cache-Control: public, max-age=31536000, immutable`;
}

// 49. Critical CSS + deferred styles concept
@Component({
  selector: 'ex-49', standalone: true,
  template: `
    <p>Critical CSS inlines above-fold styles; non-critical CSS loads asynchronously to unblock rendering.</p>
    <pre style="background:#f4f4f4;padding:8px;font-size:12px">{{ code }}</pre>
  `
})
class Ex49 {
  code = `<!-- In index.html: -->
<style>/* critical above-fold CSS inlined here */</style>
<link rel="stylesheet" href="styles.css"
      media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="styles.css"></noscript>`;
}

// 50. Full performance audit checklist component
@Component({
  selector: 'ex-50', standalone: true,
  template: `
    <div style="border:2px solid #3f51b5;padding:12px;border-radius:4px">
      <strong>Performance Audit Checklist</strong>
      <div style="margin-top:8px">
        @for (item of checklist(); track item.key) {
          <div (click)="toggle(item.key)" style="padding:4px 0;cursor:pointer;display:flex;gap:8px;align-items:center">
            <span [style.color]="item.done ? '#4caf50' : '#bbb'" style="font-size:18px">{{ item.done ? '✓' : '○' }}</span>
            <span [style.textDecoration]="item.done ? 'line-through' : 'none'" [style.color]="item.done ? '#888' : 'inherit'">
              {{ item.label }}
            </span>
          </div>
        }
      </div>
      <p style="margin-top:8px">Score: {{ score() }}/{{ checklist().length }}</p>
    </div>
  `
})
class Ex50 {
  checklist = signal([
    { key: 'onpush', label: 'OnPush change detection', done: false },
    { key: 'signals', label: 'Signals for reactive state', done: false },
    { key: 'defer', label: '@defer for non-critical content', done: false },
    { key: 'ngimage', label: 'NgOptimizedImage for images', done: false },
    { key: 'lazyroutes', label: 'Lazy-loaded routes', done: false },
    { key: 'trackby', label: 'track by id in @for', done: false },
    { key: 'outsidezone', label: 'runOutsideAngular for animations', done: false },
    { key: 'pwa', label: 'Service Worker / PWA', done: false },
    { key: 'bundle', label: 'Bundle analysis (source-map-explorer)', done: false },
    { key: 'vitals', label: 'Core Web Vitals monitored', done: false },
  ]);
  score = computed(() => this.checklist().filter(i => i.done).length);
  toggle(key: string) {
    this.checklist.update(list => list.map(i => i.key === key ? { ...i, done: !i.done } : i));
  }
}

// ─── AppComponent ────────────────────────────────────────────
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
      <h1>Examples 7.3 — Angular Performance Optimization</h1>
      <h4>1. NgOptimizedImage basic [ngSrc]</h4><ex-01 /><hr />
      <h4>2. NgOptimizedImage fill mode</h4><ex-02 /><hr />
      <h4>3. NgOptimizedImage priority (above fold)</h4><ex-03 /><hr />
      <h4>4. NgOptimizedImage with width + height</h4><ex-04 /><hr />
      <h4>5. @defer basic</h4><ex-05 /><hr />
      <h4>6. @defer on:viewport</h4><ex-06 /><hr />
      <h4>7. @defer on:idle</h4><ex-07 /><hr />
      <h4>8. @defer on:interaction</h4><ex-08 /><hr />
      <h4>9. @defer with @loading block</h4><ex-09 /><hr />
      <h4>10. @defer with @placeholder block</h4><ex-10 /><hr />
      <h4>11. @defer with @error block</h4><ex-11 /><hr />
      <h4>12. @defer when(signal condition)</h4><ex-12 /><hr />
      <h4>13. @defer prefetch on:hover</h4><ex-13 /><hr />
      <h4>14. @defer prefetch on:idle</h4><ex-14 /><hr />
      <h4>15. @defer with timer trigger (after 2s)</h4><ex-15 /><hr />
      <h4>16. NgOptimizedImage with srcset (ngSrcset)</h4><ex-16 /><hr />
      <h4>17. NgOptimizedImage with image CDN (loaderParams)</h4><ex-17 /><hr />
      <h4>18. trackBy in @for by id</h4><ex-18 /><hr />
      <h4>19. trackBy by index fallback</h4><ex-19 /><hr />
      <h4>20. OnPush + signal (no markForCheck)</h4><ex-20 /><hr />
      <h4>21. Pure pipe optimization</h4><ex-21 /><hr />
      <h4>22. Memoized computed() signal</h4><ex-22 /><hr />
      <h4>23. Avoid template function calls</h4><ex-23 /><hr />
      <h4>24. Event delegation with single listener</h4><ex-24 /><hr />
      <h4>25. Bundle splitting via loadComponent</h4><ex-25 /><hr />
      <h4>26. Preloading strategy selection</h4><ex-26 /><hr />
      <h4>27. @defer for below-fold section</h4><ex-27 /><hr />
      <h4>28. @defer for modal/overlay content</h4><ex-28 /><hr />
      <h4>29. @defer for dashboard widget</h4><ex-29 /><hr />
      <h4>30. @defer for complex data table</h4><ex-30 /><hr />
      <h4>31. @defer for chart/visualization</h4><ex-31 /><hr />
      <h4>32. @defer for third-party script widget</h4><ex-32 /><hr />
      <h4>33. Staggered loading with multiple @defer blocks</h4><ex-33 /><hr />
      <h4>34. @defer + OnPush + signals combination</h4><ex-34 /><hr />
      <h4>35. NgOptimizedImage in a @for list</h4><ex-35 /><hr />
      <h4>36. NgOptimizedImage with AVIF/WebP format hint</h4><ex-36 /><hr />
      <h4>37. Performance monitoring (PerformanceObserver)</h4><ex-37 /><hr />
      <h4>38. Full performance-optimized page layout</h4><ex-38 /><hr />
      <h4>39. ngZone.runOutsideAngular for non-Angular work</h4><ex-39 /><hr />
      <h4>40. requestAnimationFrame outside zone</h4><ex-40 /><hr />
      <h4>41. Web Workers communication pattern</h4><ex-41 /><hr />
      <h4>42. Zoneless setup concept</h4><ex-42 /><hr />
      <h4>43. Signal-based change detection (no zone.js)</h4><ex-43 /><hr />
      <h4>44. IntersectionObserver for lazy render</h4><ex-44 /><hr />
      <h4>45. ResizeObserver for responsive layout</h4><ex-45 /><hr />
      <h4>46. Service Worker registration concept</h4><ex-46 /><hr />
      <h4>47. Workbox precaching concept</h4><ex-47 /><hr />
      <h4>48. CDN + HTTP/2 push concept</h4><ex-48 /><hr />
      <h4>49. Critical CSS + deferred styles concept</h4><ex-49 /><hr />
      <h4>50. Full performance audit checklist component</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
