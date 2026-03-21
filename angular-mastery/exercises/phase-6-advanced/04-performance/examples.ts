import { Component, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef, NgZone, inject, Pipe, PipeTransform } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

// ============================================================
// Examples 6.4 — Angular Performance Optimization (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. trackBy in @for (by id)
@Component({ selector: 'ex-01', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>trackBy in @for (by id)</strong>
    <button (click)="refresh()" style="margin-left:8px;padding:5px 10px;background:#4f46e5;color:white;border:none;border-radius:4px;cursor:pointer">Refresh List</button>
    <ul style="margin:8px 0;padding-left:20px">
      @for(item of items(); track item.id) {
        <li>{{ item.name }} (id: {{ item.id }})</li>
      }
    </ul>
    <p style="font-size:12px;color:#6b7280">track item.id — Angular reuses DOM nodes with matching ids</p>
  </div>
` })
class Ex01 {
  items = signal([
    { id: 1, name: 'Alpha' }, { id: 2, name: 'Beta' }, { id: 3, name: 'Gamma' }
  ]);
  refresh() {
    this.items.set([
      { id: 1, name: 'Alpha' }, { id: 3, name: 'Gamma' }, { id: 4, name: 'Delta' }
    ]);
  }
}

// 2. trackBy (by index)
@Component({ selector: 'ex-02', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>trackBy by index</strong>
    <ul style="margin:8px 0;padding-left:20px">
      @for(item of items(); track $index) {
        <li>{{ $index + 1 }}. {{ item }}</li>
      }
    </ul>
    <p style="font-size:12px;color:#6b7280">track $index — use when items have no stable id (simple primitives)</p>
  </div>
` })
class Ex02 {
  items = signal(['Apple', 'Banana', 'Cherry', 'Date']);
}

// 3. ChangeDetectionStrategy.OnPush
@Component({
  selector: 'ex-03',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>ChangeDetectionStrategy.OnPush</strong>
    <p>Renders: <strong>{{ renderCount() }}</strong> times</p>
    <p style="font-size:12px;color:#6b7280">OnPush only re-renders when: @Input reference changes, event fires, async pipe emits, or markForCheck() is called</p>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
`})
class Ex03 {
  renderCount = signal(0);
  code = `@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
class MyComponent { }`;
}

// 4. Avoid function calls in template (use computed)
@Component({ selector: 'ex-04', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>Avoid function calls in template — use computed()</strong>
    <p>Expensive result: <strong>{{ expensiveResult() }}</strong></p>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex04 {
  items = signal([1, 2, 3, 4, 5]);
  // Good: computed runs once, memoized
  expensiveResult = computed(() => this.items().reduce((a, b) => a + b, 0));
  code = `// BAD — called on every CD cycle:
// {{ getTotal() }}

// GOOD — memoized, recalculates only when items() changes:
total = computed(() => this.items().reduce((a, b) => a + b, 0));
// {{ total() }}`;
}

// 5. Pure pipe over method
@Pipe({ name: 'formatPrice', pure: true, standalone: true })
class FormatPricePipe implements PipeTransform {
  transform(value: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
  }
}

@Component({ selector: 'ex-05', standalone: true, imports: [FormatPricePipe], template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>Pure pipe over method</strong>
    <p>Price: {{ price() | formatPrice }}</p>
    <p>Price (EUR): {{ price() | formatPrice:'EUR' }}</p>
    <button (click)="price.update(p => p + 9.99)" style="padding:5px 10px;background:#4f46e5;color:white;border:none;border-radius:4px;cursor:pointer">+$9.99</button>
    <p style="font-size:12px;color:#6b7280">Pure pipe is only re-evaluated when input reference changes</p>
  </div>
` })
class Ex05 {
  price = signal(29.99);
}

// 6. signal() for reactive state (no zone needed)
@Component({ selector: 'ex-06', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>signal() for reactive state (no zone needed)</strong>
    <p>Count: <strong>{{ count() }}</strong></p>
    <button (click)="count.update(c => c + 1)" style="padding:5px 10px;background:#4f46e5;color:white;border:none;border-radius:4px;cursor:pointer">Increment</button>
    <p style="font-size:12px;color:#6b7280">Signals notify Angular of changes directly — no Zone.js needed for change detection</p>
  </div>
` })
class Ex06 {
  count = signal(0);
}

// 7. Lazy loadComponent (code display)
@Component({ selector: 'ex-07', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>Lazy loadComponent (code display)</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex07 {
  code = `// In router config — component loaded only when route is visited
const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component')
        .then(m => m.DashboardComponent)
  }
];
// Angular creates a separate JS chunk for DashboardComponent
// → smaller initial bundle → faster first load`;
}

// 8. @defer basic usage
@Component({ selector: 'ex-08', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>@defer basic usage</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
    <div style="background:#e0e7ff;padding:8px;border-radius:4px;margin-top:8px;font-size:13px">
      Simulated deferred block renders here after idle
    </div>
  </div>
` })
class Ex08 {
  code = `@defer {
  <heavy-chart-component />
}
// Angular loads HeavyChartComponent lazily
// Default trigger: after the browser becomes idle`;
}

// 9. @defer with @loading placeholder
@Component({ selector: 'ex-09', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>@defer with @loading placeholder</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex09 {
  code = `@defer {
  <data-table [data]="rows" />
} @loading (minimum 200ms; after 100ms) {
  <div class="skeleton-loader">
    Loading table...
  </div>
}
// minimum: show loading for at least 200ms (avoids flicker)
// after: only show loading if delay exceeds 100ms`;
}

// 10. @defer with @placeholder
@Component({ selector: 'ex-10', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>@defer with @placeholder</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex10 {
  code = `@defer {
  <rich-editor />
} @placeholder (minimum 500ms) {
  <div class="placeholder-box">
    Editor placeholder (shown before defer loads)
  </div>
}
// @placeholder is shown BEFORE deferred block starts loading
// @loading is shown WHILE the chunk is downloading`;
}

// 11. @defer with @error
@Component({ selector: 'ex-11', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>@defer with @error</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex11 {
  code = `@defer {
  <map-component [coords]="coords" />
} @error {
  <div class="error-state">
    Failed to load map. <button (click)="retry()">Retry</button>
  </div>
} @loading {
  <p>Loading map...</p>
}
// @error renders if the lazy chunk fails to load (network error, etc.)`;
}

// 12. @defer on:viewport
@Component({ selector: 'ex-12', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>@defer on:viewport</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
    <div style="background:#e0e7ff;padding:8px;border-radius:4px;margin-top:8px;font-size:13px">
      Component loads when this area scrolls into the viewport
    </div>
  </div>
` })
class Ex12 {
  code = `// Loads when the @placeholder enters the viewport
@defer (on viewport) {
  <analytics-chart />
} @placeholder {
  <div style="height: 300px; background: #f3f4f6">
    Chart placeholder
  </div>
}
// Uses IntersectionObserver internally
// Great for below-the-fold content`;
}

// 13. @defer on:idle
@Component({ selector: 'ex-13', standalone: true, template: `
  <div style="background:#f0f4ff;padding:10px;border-radius:6px">
    <strong>@defer on:idle</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex13 {
  code = `// Loads after the browser finishes initial render and becomes idle
@defer (on idle) {
  <recommendation-panel />
}
// Uses requestIdleCallback internally
// Default behavior if no trigger specified
// Best for: non-critical UI that doesn't need to render immediately`;
}

// ─── INTERMEDIATE (14–26) ───────────────────────────────────

// 14. @defer on:interaction
@Component({ selector: 'ex-14', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>@defer on:interaction (click to load)</strong>
    <button (click)="loaded.set(true)" style="padding:6px 14px;background:#854d0e;color:white;border:none;border-radius:4px;cursor:pointer">Click to Load Component</button>
    @if(loaded()) {
      <div style="background:#fef08a;padding:8px;border-radius:4px;margin-top:8px">Heavy component loaded on interaction!</div>
    }
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px;margin-top:8px">{{ code }}</pre>
  </div>
` })
class Ex14 {
  loaded = signal(false);
  code = `<button #trigger>Load Editor</button>

@defer (on interaction(trigger)) {
  <rich-text-editor />
} @placeholder {
  <div class="editor-placeholder">Click button to load editor</div>
}
// Loads when user interacts (click/keydown) with #trigger element`;
}

// 15. @defer when(condition) signal
@Component({ selector: 'ex-15', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>@defer when(condition) signal</strong>
    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;margin-bottom:8px">
      <input type="checkbox" (change)="showAdvanced.set($any($event.target).checked)" />
      Show Advanced Section
    </label>
    @if(showAdvanced()) {
      <div style="background:#fef08a;padding:8px;border-radius:4px;font-size:13px">Advanced component loaded!</div>
    }
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex15 {
  showAdvanced = signal(false);
  code = `showAdvanced = signal(false);

@defer (when showAdvanced()) {
  <advanced-settings />
}
// Loads the component chunk when showAdvanced() becomes true
// Once loaded, stays loaded even if condition goes false`;
}

// 16. @defer with prefetch on:hover
@Component({ selector: 'ex-16', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>@defer with prefetch on:hover</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex16 {
  code = `<button #hoverBtn>Open Chart</button>

@defer (on interaction(hoverBtn); prefetch on hover(hoverBtn)) {
  <big-chart-component />
} @placeholder {
  <div>Chart placeholder</div>
}

// prefetch: downloads JS chunk on hover
// on interaction: actually renders on click
// Result: near-instant render when user clicks after hovering`;
}

// 17. @defer with prefetch on:idle
@Component({ selector: 'ex-17', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>@defer with prefetch on:idle</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex17 {
  code = `// Prefetch during idle, render on viewport
@defer (on viewport; prefetch on idle) {
  <chart-component />
} @placeholder {
  <div style="height: 200px">Chart placeholder</div>
}

// Strategy:
// 1. Prefetch JS chunk when browser is idle (background)
// 2. Render component when placeholder scrolls into view
// 3. Result: fast render without blocking initial load`;
}

// 18. @defer with timer trigger
@Component({ selector: 'ex-18', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>@defer with timer trigger</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex18 {
  code = `// Load component after 2 seconds
@defer (on timer(2000ms)) {
  <cookie-banner />
} @placeholder {
  <!-- Nothing shown initially -->
}

// Useful for:
// - Cookie/GDPR banners (show after page loads)
// - Chat widgets (show after user has read content)
// - Survey popups (delay to avoid disrupting UX)`;
}

// 19. NgOptimizedImage basic
@Component({ selector: 'ex-19', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>NgOptimizedImage basic</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
    <div style="background:#fef08a;padding:8px;border-radius:4px;font-size:12px;margin-top:8px">
      NgOptimizedImage automatically adds: loading="lazy", decoding="async", fetchpriority, width+height to prevent CLS
    </div>
  </div>
` })
class Ex19 {
  code = `import { NgOptimizedImage } from '@angular/common';

@Component({
  imports: [NgOptimizedImage],
  template: \`
    <!-- Use ngSrc instead of src -->
    <img ngSrc="hero.jpg" width="800" height="400" alt="Hero" />
  \`
})`;
}

// 20. NgOptimizedImage fill mode
@Component({ selector: 'ex-20', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>NgOptimizedImage fill mode</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex20 {
  code = `<!-- fill mode: image fills its container -->
<!-- parent must have position: relative/absolute/fixed -->
<div style="position: relative; width: 100%; height: 300px">
  <img ngSrc="cover-photo.jpg" fill alt="Cover" style="object-fit: cover" />
</div>

<!-- Useful for: hero images, background covers, responsive containers -->`;
}

// 21. NgOptimizedImage priority (LCP)
@Component({ selector: 'ex-21', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>NgOptimizedImage priority (LCP)</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex21 {
  code = `<!-- priority: marks image as Largest Contentful Paint candidate -->
<!-- Adds: fetchpriority="high" + preload link in head -->
<img ngSrc="hero.jpg" width="1200" height="630"
     priority alt="Hero image" />

<!-- Only add priority to above-the-fold LCP images -->
<!-- Too many priority images = no benefit -->`;
}

// 22. NgOptimizedImage with srcset
@Component({ selector: 'ex-22', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>NgOptimizedImage with srcset</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex22 {
  code = `<!-- Custom srcset for responsive images -->
<img ngSrc="photo.jpg" width="800" height="600"
     sizes="(max-width: 640px) 100vw, 800px"
     ngSrcset="100w, 200w, 400w, 800w, 1200w"
     alt="Responsive photo" />

// NgOptimizedImage generates srcset automatically when using an image CDN
// Manual ngSrcset needed for static file servers`;
}

// 23. NgOptimizedImage with image CDN loader
@Component({ selector: 'ex-23', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>NgOptimizedImage with image CDN loader</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex23 {
  code = `// In app.config.ts or module providers:
import { provideImgixLoader } from '@angular/common';

providers: [
  provideImgixLoader('https://mysite.imgix.net/')
  // Also available:
  // provideCloudinaryLoader('https://res.cloudinary.com/mycloud/')
  // provideImageKitLoader('https://ik.imagekit.io/mysite/')
  // provideTwicPicsLoader('https://mysite.twic.pics/')
]

// Then Angular auto-generates optimal srcsets for each image`;
}

// 24. Memoized computed() signal
@Component({ selector: 'ex-24', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>Memoized computed() signal</strong>
    <button (click)="items.update(i => [...i, Math.random()])" style="margin:4px;padding:5px 10px;background:#4f46e5;color:white;border:none;border-radius:4px;cursor:pointer">Add Item</button>
    <button (click)="other.update(v => v + 1)" style="margin:4px;padding:5px 10px;background:#6b7280;color:white;border:none;border-radius:4px;cursor:pointer">Update Other</button>
    <p>Sum: <strong>{{ sum() }}</strong> | Other: {{ other() }}</p>
    <p style="font-size:12px;color:#6b7280">sum() only recalculates when items() changes, not when other() changes</p>
  </div>
` })
class Ex24 {
  items = signal([1, 2, 3]);
  other = signal(0);
  sum = computed(() => {
    const result = this.items().reduce((a, b) => a + b, 0);
    return Math.round(result * 100) / 100;
  });
}

// 25. OnPush + markForCheck() comparison
@Component({
  selector: 'ex-25',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>OnPush + markForCheck()</strong>
    <p>Message: <strong>{{ message }}</strong></p>
    <button (click)="update()" style="padding:5px 10px;background:#854d0e;color:white;border:none;border-radius:4px;cursor:pointer">Update (needs markForCheck)</button>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px;margin-top:8px">{{ code }}</pre>
  </div>
`})
class Ex25 {
  message = 'Initial';
  cdr = inject(ChangeDetectorRef);
  code = `// With OnPush, mutations to non-signal properties need manual trigger:
this.message = 'Updated';
this.cdr.markForCheck(); // tells Angular to check this component

// Better: use signals — they auto-notify without markForCheck()`;
  update() {
    this.message = 'Updated at ' + new Date().toLocaleTimeString();
    this.cdr.markForCheck();
  }
}

// 26. Event delegation pattern
@Component({ selector: 'ex-26', standalone: true, template: `
  <div style="background:#fef9c3;padding:10px;border-radius:6px">
    <strong>Event delegation pattern</strong>
    <div (click)="handleClick($event)" style="background:white;border:1px solid #e5e7eb;border-radius:6px;padding:8px">
      @for(item of items; track item.id) {
        <div [attr.data-id]="item.id" style="padding:6px 10px;margin:2px;background:#f3f4f6;border-radius:4px;cursor:pointer">
          {{ item.label }}
        </div>
      }
    </div>
    @if(selected()) { <p style="font-size:13px;color:#4f46e5">Selected: {{ selected() }}</p> }
    <p style="font-size:12px;color:#6b7280">One (click) handler on parent — no per-item event binding</p>
  </div>
` })
class Ex26 {
  items = [
    { id: 1, label: 'Item Alpha' },
    { id: 2, label: 'Item Beta' },
    { id: 3, label: 'Item Gamma' },
  ];
  selected = signal('');
  handleClick(e: Event) {
    const target = (e.target as HTMLElement).closest('[data-id]') as HTMLElement;
    if (target) this.selected.set('Item #' + target.dataset['id']);
  }
}

// ─── NESTED (27–38) ─────────────────────────────────────────

// 27. @defer for below-fold content section
@Component({ selector: 'ex-27', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>@defer for below-fold content section</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex27 {
  code = `<!-- Above fold: eager -->
<hero-section />
<featured-products />

<!-- Below fold: deferred -->
@defer (on viewport; prefetch on idle) {
  <testimonials-section />
  <newsletter-form />
  <footer-section />
} @placeholder {
  <div style="height: 800px" aria-hidden="true"></div>
}`;
}

// 28. @defer for modal content
@Component({ selector: 'ex-28', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>@defer for modal content</strong>
    <button (click)="open.set(true)" style="padding:6px 14px;background:#166534;color:white;border:none;border-radius:4px;cursor:pointer">Open Modal</button>
    @if(open()) {
      <div style="position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:999;display:flex;align-items:center;justify-content:center">
        <div style="background:white;padding:24px;border-radius:8px;min-width:300px">
          <h3 style="margin:0 0 12px">Modal Content (deferred)</h3>
          <p style="color:#6b7280;font-size:13px">Complex modal UI loaded on demand</p>
          <button (click)="open.set(false)" style="padding:6px 14px;background:#16a34a;color:white;border:none;border-radius:4px;cursor:pointer">Close</button>
        </div>
      </div>
    }
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px;margin-top:8px">{{ code }}</pre>
  </div>
` })
class Ex28 {
  open = signal(false);
  code = `showModal = signal(false);

@defer (when showModal()) {
  <complex-modal-form />
}

// Modal UI (forms, pickers, editors) loaded only when opened
// Initial bundle stays lean`;
}

// 29. @defer for dashboard widget
@Component({ selector: 'ex-29', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>@defer for dashboard widget</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex29 {
  code = `<!-- Each widget deferred independently -->
<div class="dashboard-grid">
  @defer (on viewport; prefetch on idle) {
    <revenue-chart [data]="revenueData" />
  } @loading { <widget-skeleton /> }

  @defer (on viewport) {
    <user-stats [period]="period" />
  } @loading { <widget-skeleton /> }

  @defer (on idle) {
    <activity-feed [limit]="10" />
  } @placeholder { <div class="feed-placeholder" /> }
</div>`;
}

// 30. @defer for complex data table
@Component({ selector: 'ex-30', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>@defer for complex data table</strong>
    <button (click)="show.set(true)" style="padding:6px 14px;background:#166534;color:white;border:none;border-radius:4px;cursor:pointer">Show Table</button>
    @if(show()) {
      <div style="background:white;border:1px solid #bbf7d0;border-radius:6px;padding:12px;margin-top:8px;overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="background:#f0fdf4">
            @for(col of cols; track col) { <th style="padding:6px 10px;text-align:left;border-bottom:1px solid #bbf7d0">{{ col }}</th> }
          </tr></thead>
          <tbody>
            @for(row of rows; track row.id) {
              <tr style="border-bottom:1px solid #f0f0f0">
                @for(col of cols; track col) { <td style="padding:6px 10px">{{ row[col] }}</td> }
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
    <p style="font-size:12px;color:#6b7280;margin-top:4px">Table JS deferred until needed</p>
  </div>
` })
class Ex30 {
  show = signal(false);
  cols = ['id', 'name', 'role', 'status'];
  rows = [
    { id: 1, name: 'Alice', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Bob', role: 'Editor', status: 'Active' },
    { id: 3, name: 'Carol', role: 'Viewer', status: 'Inactive' },
  ];
}

// 31. @defer for chart component
@Component({ selector: 'ex-31', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>@defer for chart component</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex31 {
  code = `// Chart libraries (Chart.js, D3, etc.) are very large
// Always defer them!

@defer (on viewport; prefetch on idle) {
  <bar-chart [labels]="labels" [data]="chartData" />
} @placeholder {
  <!-- Reserve space to prevent CLS -->
  <div style="width:100%;height:300px;background:#f9fafb;
              border-radius:8px;display:flex;align-items:center;
              justify-content:center;color:#9ca3af">
    Chart loading...
  </div>
} @loading (minimum 300ms) {
  <chart-skeleton />
}`;
}

// 32. @defer for third-party embed
@Component({ selector: 'ex-32', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>@defer for third-party embed</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex32 {
  code = `// Heavy third-party embeds (maps, videos, social, chat)
// load only when user scrolls to them

@defer (on viewport) {
  <google-map [center]="center" [zoom]="12" />
} @placeholder {
  <div class="map-placeholder" style="height:400px">
    <button (click)="loadMap()">Load Map</button>
  </div>
}

@defer (on interaction(playBtn)) {
  <youtube-player [videoId]="videoId" />
} @placeholder {
  <button #playBtn class="play-btn">▶ Play Video</button>
}`;
}

// 33. Virtual scrolling concept
@Component({ selector: 'ex-33', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>Virtual scrolling concept (CDK)</strong>
    <div style="height:150px;overflow-y:auto;border:1px solid #bbf7d0;border-radius:4px;padding:4px">
      @for(item of bigList; track $index) {
        <div style="padding:4px 8px;font-size:13px;border-bottom:1px solid #f0f0f0">Item #{{ item }}</div>
      }
    </div>
    <p style="font-size:12px;color:#6b7280;margin-top:4px">With real CDK: only visible rows are in the DOM</p>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex33 {
  bigList = Array.from({ length: 30 }, (_, i) => i + 1);
  code = `import { ScrollingModule } from '@angular/cdk/scrolling';

<cdk-virtual-scroll-viewport itemSize="48" style="height: 400px">
  @for (item of hugeList; track item.id) {
    *cdkVirtualFor="let item of items"  <!-- CDK handles rendering -->
    <div style="height: 48px">{{ item.name }}</div>
  }
</cdk-virtual-scroll-viewport>
// Only ~10 DOM nodes regardless of list size (10,000+ items)`;
}

// 34. Staggered loading with multiple @defer
@Component({ selector: 'ex-34', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>Staggered loading with multiple @defer</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex34 {
  code = `<!-- Load sections progressively as user scrolls -->
<section>
  <hero-banner />  <!-- Eager: critical -->
</section>

@defer (on idle) {
  <featured-section />  <!-- ~500ms after load -->
}

@defer (on viewport) {
  <product-grid />  <!-- When user scrolls to it -->
}

@defer (on viewport) {
  <reviews-section />  <!-- Further down -->
}

@defer (on idle; prefetch on viewport) {
  <footer-component />  <!-- Prefetch early, render last -->
}`;
}

// 35. @defer for off-screen list items
@Component({ selector: 'ex-35', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>@defer for off-screen list items</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex35 {
  code = `// Defer heavy items in a long page feed
@for (post of posts(); track post.id; let i = $index) {
  @if (i < 5) {
    <!-- Eager: first 5 above the fold -->
    <post-card [post]="post" />
  } @else {
    @defer (on viewport) {
      <post-card [post]="post" />
    } @placeholder {
      <div class="post-skeleton" style="height:200px"></div>
    }
  }
}`;
}

// 36. @defer + OnPush + signals combination
@Component({
  selector: 'ex-36',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>@defer + OnPush + signals combination</strong>
    <p>Count: {{ count() }} | Filtered: {{ filtered() }}</p>
    <button (click)="count.update(c => c + 1)" style="padding:5px 10px;background:#166534;color:white;border:none;border-radius:4px;cursor:pointer">Increment</button>
    <p style="font-size:12px;color:#6b7280">OnPush + signals = only re-renders when signals change. @defer = lazy loads component chunk.</p>
  </div>
`})
class Ex36 {
  count = signal(0);
  filtered = computed(() => this.count() * 2);
}

// 37. Page with strategic @defer placement
@Component({ selector: 'ex-37', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>Page with strategic @defer placement</strong>
    <div style="background:white;border:1px solid #bbf7d0;border-radius:6px;padding:12px;font-size:13px">
      <div style="background:#dcfce7;padding:6px 10px;border-radius:4px;margin-bottom:6px">✓ EAGER: Nav, Hero (critical path)</div>
      <div style="background:#fef9c3;padding:6px 10px;border-radius:4px;margin-bottom:6px">⟳ on:idle — Featured Products (non-critical)</div>
      <div style="background:#fce7f3;padding:6px 10px;border-radius:4px;margin-bottom:6px">👁 on:viewport — Reviews Section</div>
      <div style="background:#e0e7ff;padding:6px 10px;border-radius:4px;margin-bottom:6px">👁 on:viewport — Product Grid</div>
      <div style="background:#f3f4f6;padding:6px 10px;border-radius:4px">⟳ on:idle — Footer</div>
    </div>
  </div>
` })
class Ex37 {}

// 38. Full performance-optimized page structure
@Component({ selector: 'ex-38', standalone: true, template: `
  <div style="background:#dcfce7;padding:10px;border-radius:6px">
    <strong>Full performance-optimized page structure</strong>
    <div style="background:white;border:1px solid #bbf7d0;border-radius:6px;padding:12px">
      @for(tip of tips; track tip.category) {
        <div style="margin-bottom:10px">
          <div style="font-weight:600;color:#166534;font-size:13px">{{ tip.category }}</div>
          <ul style="margin:4px 0;padding-left:16px">
            @for(item of tip.items; track item) {
              <li style="font-size:12px;color:#4b5563;margin-bottom:2px">{{ item }}</li>
            }
          </ul>
        </div>
      }
    </div>
  </div>
` })
class Ex38 {
  tips = [
    { category: 'Bundle', items: ['Lazy routes (loadComponent)', '@defer for heavy UI', 'Tree-shake unused imports'] },
    { category: 'Rendering', items: ['OnPush everywhere', 'Signals over observables', 'trackBy in @for'] },
    { category: 'Assets', items: ['NgOptimizedImage', 'priority for LCP image', 'CDN loader for srcset'] },
    { category: 'Runtime', items: ['computed() over methods', 'Pure pipes', 'Event delegation'] },
  ];
}

// ─── ADVANCED (39–50) ────────────────────────────────────────

// 39. Web Workers integration concept
@Component({ selector: 'ex-39', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>Web Workers integration concept</strong>
    <button (click)="runWorker()" style="padding:6px 14px;background:#9d174d;color:white;border:none;border-radius:4px;cursor:pointer">Run Heavy Computation</button>
    @if(result()) { <p>Result: <strong>{{ result() }}</strong></p> }
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px;margin-top:8px">{{ code }}</pre>
  </div>
` })
class Ex39 {
  result = signal('');
  code = `// ng generate web-worker app
// Creates: app.worker.ts

// In component:
const worker = new Worker(new URL('./app.worker', import.meta.url));
worker.onmessage = ({ data }) => {
  this.result.set(data); // back on main thread
};
worker.postMessage({ type: 'fibonacci', n: 45 });
// Heavy computation runs off main thread — UI stays responsive`;
  runWorker() {
    setTimeout(() => this.result.set('fib(40) = 102334155 (simulated)'), 500);
  }
}

// 40. requestAnimationFrame in Angular (runOutsideAngular)
@Component({ selector: 'ex-40', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>requestAnimationFrame outside NgZone</strong>
    <canvas #canvas width="300" height="80" style="border:1px solid #f9a8d4;border-radius:4px;display:block;margin:8px 0"></canvas>
    <button (click)="toggleAnim()" style="padding:6px 14px;background:#9d174d;color:white;border:none;border-radius:4px;cursor:pointer">{{ running() ? 'Stop' : 'Start' }} Animation</button>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px;margin-top:8px">{{ code }}</pre>
  </div>
` })
class Ex40 {
  running = signal(false);
  zone = inject(NgZone);
  code = `// Animations run outside NgZone — no CD on every rAF
this.ngZone.runOutsideAngular(() => {
  const loop = () => {
    if (!this.running()) return;
    this.draw(); // canvas/animation work
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
});

// Only call zone.run() when you need Angular to update UI
this.ngZone.run(() => this.score.update(s => s + 1));`;
  toggleAnim() { this.running.update(v => !v); }
}

// 41. Zoneless Angular setup concept
@Component({ selector: 'ex-41', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>Zoneless Angular (provideExperimentalZonelessChangeDetection)</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex41 {
  code = `// app.config.ts
import { provideExperimentalZonelessChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    // Remove zone.js from angular.json polyfills too
  ]
};

// Benefits:
// - No Zone.js patching (smaller bundle, less overhead)
// - CD driven entirely by signals
// - Better SSR performance
// - Works with signals + async pipe`;
}

// 42. Signal-based CD (no zone required)
@Component({ selector: 'ex-42', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>Signal-based CD (no zone required)</strong>
    <p>Counter: <strong>{{ counter() }}</strong></p>
    <p>Double: <strong>{{ double() }}</strong></p>
    <button (click)="counter.update(c => c + 1)" style="padding:5px 10px;background:#9d174d;color:white;border:none;border-radius:4px;cursor:pointer">+1</button>
    <p style="font-size:12px;color:#6b7280;margin-top:6px">With zoneless: only this component re-renders when counter() changes</p>
  </div>
` })
class Ex42 {
  counter = signal(0);
  double = computed(() => this.counter() * 2);
}

// 43. IntersectionObserver for lazy loading
@Component({ selector: 'ex-43', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>IntersectionObserver for lazy loading</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex43 {
  code = `// Directive that emits when element enters viewport
@Directive({ selector: '[appLazyLoad]', standalone: true })
class LazyLoadDirective implements OnInit, OnDestroy {
  private observer!: IntersectionObserver;
  visible = output<boolean>();

  el = inject(ElementRef);

  ngOnInit() {
    this.observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        this.visible.emit(true);
        this.observer.disconnect(); // fire once
      }
    }, { threshold: 0.1 });
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy() { this.observer.disconnect(); }
}`;
}

// 44. ResizeObserver for responsive components
@Component({ selector: 'ex-44', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>ResizeObserver for responsive components</strong>
    <div #box style="background:white;border:2px solid #f9a8d4;border-radius:6px;padding:12px;resize:horizontal;overflow:auto;min-width:150px">
      Width: {{ width() }}px
      <div [style]="'font-size:11px;color:' + (width() < 200 ? '#dc2626' : '#16a34a')">
        {{ width() < 200 ? 'compact' : 'normal' }} layout
      </div>
    </div>
    <p style="font-size:12px;color:#6b7280;margin-top:4px">Drag the corner to resize (ResizeObserver concept)</p>
  </div>
` })
class Ex44 {
  width = signal(300);
}

// 45. PerformanceObserver integration
@Component({ selector: 'ex-45', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>PerformanceObserver integration</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex45 {
  code = `// Monitor long tasks that block the main thread
ngOnInit() {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 50) {
        console.warn('Long task detected:', entry.duration, 'ms');
        // Report to analytics
        this.analyticsService.reportLongTask(entry);
      }
    }
  });
  observer.observe({ entryTypes: ['longtask'] });
}

// Also useful:
// entryTypes: ['largest-contentful-paint'] — track LCP
// entryTypes: ['layout-shift'] — track CLS
// entryTypes: ['first-input'] — track FID`;
}

// 46. Memory leak prevention patterns
@Component({ selector: 'ex-46', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>Memory leak prevention patterns</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex46 {
  code = `// Pattern 1: takeUntilDestroyed (Angular 16+)
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

this.service.data$.pipe(
  takeUntilDestroyed()  // auto-unsubscribes on component destroy
).subscribe(data => this.data.set(data));

// Pattern 2: DestroyRef
const destroyRef = inject(DestroyRef);
destroyRef.onDestroy(() => {
  this.subscription.unsubscribe();
  this.observer.disconnect();
  clearInterval(this.timer);
});

// Pattern 3: async pipe (auto-unsubscribes)
// {{ data$ | async }}`;
}

// 47. Bundle size optimization concepts
@Component({ selector: 'ex-47', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>Bundle size optimization concepts</strong>
    <div style="background:white;border:1px solid #f9a8d4;border-radius:6px;padding:12px">
      @for(tip of tips; track tip) {
        <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;font-size:13px">
          <span style="color:#9d174d;font-weight:bold;min-width:16px">✓</span>
          <span>{{ tip }}</span>
        </div>
      }
    </div>
  </div>
` })
class Ex47 {
  tips = [
    'Use standalone components (no NgModule overhead)',
    'Import only what you need from libraries (tree-shaking)',
    'Use @defer for heavy components/libraries',
    'Avoid barrel files (re-exports break tree-shaking)',
    'Use loadComponent/loadChildren for route-level splitting',
    'Analyze bundle with: ng build --stats-json + webpack-bundle-analyzer',
    'Replace heavy libs: moment → date-fns, lodash → native',
  ];
}

// 48. Core Web Vitals: LCP, FID, CLS tips
@Component({ selector: 'ex-48', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>Core Web Vitals: LCP, FID, CLS tips</strong>
    @for(metric of metrics; track metric.name) {
      <div style="background:white;border:1px solid #f9a8d4;border-radius:6px;padding:10px;margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span [style]="'background:' + metric.color + ';color:white;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:bold'">{{ metric.name }}</span>
          <span style="font-size:12px;color:#6b7280">{{ metric.full }}</span>
        </div>
        <ul style="margin:0;padding-left:16px">
          @for(tip of metric.tips; track tip) {
            <li style="font-size:12px;color:#4b5563;margin-bottom:2px">{{ tip }}</li>
          }
        </ul>
      </div>
    }
  </div>
` })
class Ex48 {
  metrics = [
    {
      name: 'LCP', full: 'Largest Contentful Paint (< 2.5s)',
      color: '#16a34a',
      tips: ['NgOptimizedImage with priority', 'Preload critical fonts', 'SSR/SSG for fast TTFB', '@defer non-LCP content']
    },
    {
      name: 'FID/INP', full: 'Interaction to Next Paint (< 200ms)',
      color: '#4f46e5',
      tips: ['Avoid long tasks (> 50ms)', 'Use Web Workers for heavy compute', 'runOutsideAngular for animations', 'OnPush + signals']
    },
    {
      name: 'CLS', full: 'Cumulative Layout Shift (< 0.1)',
      color: '#dc2626',
      tips: ['Set explicit width/height on images', 'Reserve space for @defer placeholders', 'Avoid injecting content above existing content']
    },
  ];
}

// 49. Service Worker / PWA concept
@Component({ selector: 'ex-49', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>Service Worker / PWA concept</strong>
    <pre style="background:#1e1e1e;color:#9cdcfe;padding:8px;border-radius:4px;font-size:11px">{{ code }}</pre>
  </div>
` })
class Ex49 {
  code = `// Add PWA support:
// ng add @angular/pwa

// ngsw-config.json — controls what gets cached:
{
  "assetGroups": [{
    "name": "app",
    "installMode": "prefetch",  // cache on install
    "resources": {
      "files": ["/favicon.ico", "/index.html", "/*.css", "/*.js"]
    }
  }],
  "dataGroups": [{
    "name": "api-data",
    "urls": ["/api/**"],
    "cacheConfig": {
      "strategy": "freshness",  // network-first
      "maxSize": 100,
      "maxAge": "1h"
    }
  }]
}

// SwUpdate service for update notifications:
// swUpdate.versionUpdates.subscribe(...)`;
}

// 50. Full performance checklist component
@Component({ selector: 'ex-50', standalone: true, template: `
  <div style="background:#fce7f3;padding:10px;border-radius:6px">
    <strong>Full performance checklist</strong>
    <div style="background:white;border:1px solid #f9a8d4;border-radius:6px;padding:12px">
      @for(section of checklist; track section.title) {
        <div style="margin-bottom:10px">
          <div style="font-weight:600;color:#9d174d;font-size:13px;margin-bottom:4px">{{ section.title }}</div>
          @for(item of section.items; track item.label) {
            <label style="display:flex;align-items:center;gap:6px;margin-bottom:3px;cursor:pointer;font-size:12px">
              <input type="checkbox" [(ngModel)]="item.done" />
              <span [style]="item.done ? 'text-decoration:line-through;color:#9ca3af' : ''">{{ item.label }}</span>
            </label>
          }
        </div>
      }
      <div style="margin-top:8px;padding:8px;background:#fdf4ff;border-radius:4px;font-size:12px">
        Completed: {{ doneCount() }} / {{ totalCount() }}
      </div>
    </div>
  </div>
` })
class Ex50 {
  checklist = [
    { title: 'Bundle', items: [
      { label: 'Lazy load all routes', done: false },
      { label: '@defer for heavy components', done: false },
      { label: 'Remove unused imports', done: false },
    ]},
    { title: 'Rendering', items: [
      { label: 'OnPush on all components', done: false },
      { label: 'trackBy on all @for', done: false },
      { label: 'Use signals/computed', done: false },
    ]},
    { title: 'Assets', items: [
      { label: 'NgOptimizedImage for all images', done: false },
      { label: 'priority on LCP image', done: false },
    ]},
    { title: 'Runtime', items: [
      { label: 'No function calls in template', done: false },
      { label: 'Unsubscribe with takeUntilDestroyed', done: false },
    ]},
  ];
  doneCount = computed(() => this.checklist.flatMap(s => s.items).filter(i => i.done).length);
  totalCount = computed(() => this.checklist.flatMap(s => s.items).length);
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
      <h1>Examples 6.4 — Angular Performance Optimization</h1>

      <h4>1. trackBy in @for (by id)</h4><ex-01 /><hr />
      <h4>2. trackBy by index</h4><ex-02 /><hr />
      <h4>3. ChangeDetectionStrategy.OnPush</h4><ex-03 /><hr />
      <h4>4. Avoid function calls in template (use computed)</h4><ex-04 /><hr />
      <h4>5. Pure pipe over method</h4><ex-05 /><hr />
      <h4>6. signal() for reactive state (no zone needed)</h4><ex-06 /><hr />
      <h4>7. Lazy loadComponent (code display)</h4><ex-07 /><hr />
      <h4>8. @defer basic usage</h4><ex-08 /><hr />
      <h4>9. @defer with @loading placeholder</h4><ex-09 /><hr />
      <h4>10. @defer with @placeholder</h4><ex-10 /><hr />
      <h4>11. @defer with @error</h4><ex-11 /><hr />
      <h4>12. @defer on:viewport</h4><ex-12 /><hr />
      <h4>13. @defer on:idle</h4><ex-13 /><hr />

      <h4>14. @defer on:interaction (click to load)</h4><ex-14 /><hr />
      <h4>15. @defer when(condition) signal</h4><ex-15 /><hr />
      <h4>16. @defer with prefetch on:hover</h4><ex-16 /><hr />
      <h4>17. @defer with prefetch on:idle</h4><ex-17 /><hr />
      <h4>18. @defer with timer trigger</h4><ex-18 /><hr />
      <h4>19. NgOptimizedImage basic</h4><ex-19 /><hr />
      <h4>20. NgOptimizedImage fill mode</h4><ex-20 /><hr />
      <h4>21. NgOptimizedImage priority (LCP)</h4><ex-21 /><hr />
      <h4>22. NgOptimizedImage with srcset</h4><ex-22 /><hr />
      <h4>23. NgOptimizedImage with image CDN loader</h4><ex-23 /><hr />
      <h4>24. Memoized computed() signal</h4><ex-24 /><hr />
      <h4>25. OnPush + markForCheck()</h4><ex-25 /><hr />
      <h4>26. Event delegation pattern</h4><ex-26 /><hr />

      <h4>27. @defer for below-fold content section</h4><ex-27 /><hr />
      <h4>28. @defer for modal content</h4><ex-28 /><hr />
      <h4>29. @defer for dashboard widget</h4><ex-29 /><hr />
      <h4>30. @defer for complex data table</h4><ex-30 /><hr />
      <h4>31. @defer for chart component</h4><ex-31 /><hr />
      <h4>32. @defer for third-party embed</h4><ex-32 /><hr />
      <h4>33. Virtual scrolling concept (CDK)</h4><ex-33 /><hr />
      <h4>34. Staggered loading with multiple @defer</h4><ex-34 /><hr />
      <h4>35. @defer for off-screen list items</h4><ex-35 /><hr />
      <h4>36. @defer + OnPush + signals combination</h4><ex-36 /><hr />
      <h4>37. Page with strategic @defer placement</h4><ex-37 /><hr />
      <h4>38. Full performance-optimized page structure</h4><ex-38 /><hr />

      <h4>39. Web Workers integration concept</h4><ex-39 /><hr />
      <h4>40. requestAnimationFrame outside NgZone</h4><ex-40 /><hr />
      <h4>41. Zoneless Angular setup concept</h4><ex-41 /><hr />
      <h4>42. Signal-based CD (no zone required)</h4><ex-42 /><hr />
      <h4>43. IntersectionObserver for lazy loading</h4><ex-43 /><hr />
      <h4>44. ResizeObserver for responsive components</h4><ex-44 /><hr />
      <h4>45. PerformanceObserver integration</h4><ex-45 /><hr />
      <h4>46. Memory leak prevention patterns</h4><ex-46 /><hr />
      <h4>47. Bundle size optimization concepts</h4><ex-47 /><hr />
      <h4>48. Core Web Vitals: LCP, FID, CLS tips</h4><ex-48 /><hr />
      <h4>49. Service Worker / PWA concept</h4><ex-49 /><hr />
      <h4>50. Full performance checklist</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
