// Phase 7 - Solution 03: Performance Optimization
// Topics: preloading, Intersection Observer, Service Worker, font optimization,
//         bundle analysis, DNS prefetch, preconnect

import {
  Component, signal, Input, AfterViewInit, ViewChild, ElementRef,
  inject, PLATFORM_ID, OnInit, OnDestroy
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

// ─────────────────────────────────────────────────────────────────────────────
// 1. LazyImageComponent — Intersection Observer
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-lazy-image',
  standalone: true,
  template: `
    <div style="position:relative; background:#f0f0f0; border-radius:4px; overflow:hidden"
         [style.min-height]="height + 'px'">
      <img #imgEl [alt]="alt"
           style="width:100%; height:100%; object-fit:cover; display:block; transition:opacity 0.3s"
           [style.opacity]="loaded ? '1' : '0'" />
      @if (!loaded) {
        <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#999; font-size:0.85rem">
          <span>{{ intersected ? 'Loading...' : 'Scroll to load' }}</span>
        </div>
      }
    </div>
  `,
})
export class LazyImageComponent implements AfterViewInit, OnDestroy {
  @Input() src  = '';
  @Input() alt  = '';
  @Input() height = 200;

  @ViewChild('imgEl') imgRef!: ElementRef<HTMLImageElement>;

  loaded       = false;
  intersected  = false;
  private observer?: IntersectionObserver;
  private platformId = inject(PLATFORM_ID);

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) {
      // SSR: set src directly (no Intersection Observer on server)
      this.imgRef.nativeElement.src = this.src;
      return;
    }

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.intersected = true;
          const img = this.imgRef.nativeElement;
          img.onload = () => { this.loaded = true; };
          img.src = this.src;
          this.observer?.disconnect();
        }
      },
      { rootMargin: '100px' }  // load 100px before entering viewport
    );

    this.observer.observe(this.imgRef.nativeElement);
  }

  ngOnDestroy() { this.observer?.disconnect(); }
}

@Component({
  selector: 'app-lazy-image-demo',
  standalone: true,
  imports: [LazyImageComponent],
  template: `
    <div style="padding:1.5rem; background:#e8f5e9; border-radius:8px; margin-bottom:1rem">
      <h3>Lazy Image Loading (Intersection Observer)</h3>
      <p style="font-size:0.9rem; color:#555">
        Images below load only when they enter the viewport.
        In production, use <code>loading="lazy"</code> attribute or NgOptimizedImage.
      </p>
      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:0.5rem">
        @for (img of images; track img.src) {
          <app-lazy-image [src]="img.src" [alt]="img.alt" [height]="120" />
        }
      </div>
    </div>
  `,
})
export class LazyImageDemoComponent {
  images = [
    { src: 'https://picsum.photos/seed/a1/300/200', alt: 'Random image 1' },
    { src: 'https://picsum.photos/seed/a2/300/200', alt: 'Random image 2' },
    { src: 'https://picsum.photos/seed/a3/300/200', alt: 'Random image 3' },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PreconnectInfoComponent
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-preconnect-info',
  standalone: true,
  template: `
    <div style="padding:1.5rem; background:#fff3e0; border-radius:8px; margin-bottom:1rem">
      <h3>Resource Hints (index.html &lt;head&gt;)</h3>
      <table style="width:100%; border-collapse:collapse; font-size:0.85rem">
        <thead>
          <tr style="background:#e65100; color:white">
            <th style="padding:0.4rem; text-align:left">Hint</th>
            <th style="padding:0.4rem; text-align:left">Effect</th>
            <th style="padding:0.4rem; text-align:left">Use case</th>
          </tr>
        </thead>
        <tbody>
          @for (h of hints; track h.tag) {
            <tr style="border-bottom:1px solid #ddd">
              <td style="padding:0.4rem"><code>{{ h.tag }}</code></td>
              <td style="padding:0.4rem">{{ h.effect }}</td>
              <td style="padding:0.4rem; color:#555">{{ h.use }}</td>
            </tr>
          }
        </tbody>
      </table>

      <pre style="margin-top:0.75rem; background:#1e1e1e; color:#d4d4d4; padding:0.75rem; border-radius:4px; font-size:0.8rem">{{ htmlSnippet }}</pre>
    </div>
  `,
})
export class PreconnectInfoComponent {
  hints = [
    { tag: 'rel="preconnect"',    effect: 'Opens TCP+TLS connection early',       use: 'CDN, API, Fonts — max 2-3 origins' },
    { tag: 'rel="dns-prefetch"',  effect: 'DNS lookup only (no connection)',       use: 'Third-party origins, analytics' },
    { tag: 'rel="preload"',       effect: 'Fetch resource immediately, high pri', use: 'LCP image, critical CSS/fonts' },
    { tag: 'rel="prefetch"',      effect: 'Fetch when idle, low priority',        use: 'Next page, user likely to visit' },
    { tag: 'rel="modulepreload"', effect: 'Preload JS module + its imports',       use: 'Critical async module chunks' },
  ];

  htmlSnippet = `<!-- index.html <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="dns-prefetch" href="https://cdn.myapi.com">

<!-- Preload LCP image -->
<link rel="preload" href="/assets/hero.jpg" as="image" fetchpriority="high">

<!-- Preload critical font -->
<link rel="preload" href="/fonts/my-font.woff2" as="font" type="font/woff2" crossorigin>

<!-- Angular preloads lazy chunks automatically with PreloadAllModules -->`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. BundleAnalysisComponent
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-bundle-analysis',
  standalone: true,
  template: `
    <div style="padding:1.5rem; background:#e8eaf6; border-radius:8px; margin-bottom:1rem">
      <h3>Bundle Analysis</h3>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; font-size:0.9rem">
        @for (step of steps; track step.title) {
          <div style="background:white; padding:0.75rem; border-radius:4px">
            <strong>{{ step.title }}</strong>
            <pre style="margin:0.4rem 0 0; font-size:0.8rem; background:#f5f5f5; padding:0.5rem; border-radius:3px; overflow:auto">{{ step.code }}</pre>
            @if (step.note) {
              <p style="margin:0.4rem 0 0; font-size:0.8rem; color:#555">{{ step.note }}</p>
            }
          </div>
        }
      </div>

      <div style="margin-top:0.75rem; background:#e8eaf6; padding:0.75rem; border-radius:4px; font-size:0.85rem">
        <strong>What to look for:</strong>
        <ul style="margin:0.4rem 0 0; padding-left:1.25rem">
          <li>Initial bundle &gt; 200KB (gzipped) — lazy-load more routes</li>
          <li>Duplicate packages (lodash + lodash-es in same chunk)</li>
          <li>Unused @angular/* packages (tree-shaking might not be working)</li>
          <li>Large icon libraries (import individual icons, not entire sets)</li>
          <li>moment.js (replace with date-fns or day.js)</li>
        </ul>
      </div>
    </div>
  `,
})
export class BundleAnalysisComponent {
  steps = [
    {
      title: '1. Generate stats',
      code: 'ng build --stats-json\n# Creates dist/browser/stats.json',
      note: null,
    },
    {
      title: '2. Analyze with webpack-bundle-analyzer',
      code: 'npm install -g webpack-bundle-analyzer\nwebpack-bundle-analyzer dist/browser/stats.json',
      note: 'Opens interactive treemap in browser',
    },
    {
      title: '3. Source map explorer',
      code: 'npm install -g source-map-explorer\nng build --source-map\nnpx source-map-explorer dist/browser/*.js',
      note: 'More accurate than webpack-ba for real sizes',
    },
    {
      title: '4. Angular budget warnings',
      code: `// angular.json budgets:
"budgets": [
  {
    "type": "initial",
    "maximumWarning": "500kb",
    "maximumError": "1mb"
  }
]`,
      note: 'Build fails when bundle exceeds maximumError',
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ServiceWorkerInfoComponent
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-sw-info',
  standalone: true,
  template: `
    <div style="padding:1.5rem; background:#fce4ec; border-radius:8px; margin-bottom:1rem">
      <h3>Service Worker / PWA (@angular/pwa)</h3>

      <div style="display:grid; gap:0.75rem; font-size:0.9rem">
        @for (section of sections; track section.title) {
          <div style="background:white; padding:0.75rem; border-radius:4px">
            <strong>{{ section.title }}</strong>
            <pre style="margin:0.4rem 0 0; font-size:0.8rem; background:#f5f5f5; padding:0.5rem; border-radius:3px; overflow:auto">{{ section.code }}</pre>
          </div>
        }
      </div>
    </div>
  `,
})
export class ServiceWorkerInfoComponent {
  sections = [
    {
      title: 'Setup',
      code: `ng add @angular/pwa
# Adds: ngsw-worker.js, ngsw-config.json, manifest.webmanifest`,
    },
    {
      title: 'Register in app.config.ts',
      code: `import { provideServiceWorker } from '@angular/service-worker';
import { isDevMode } from '@angular/core';

providers: [
  provideServiceWorker('ngsw-worker.js', {
    enabled: !isDevMode(),
    registrationStrategy: 'registerWhenStable:30000'
  })
]`,
    },
    {
      title: 'Update detection with SwUpdate',
      code: `const swUpdate = inject(SwUpdate);

if (swUpdate.isEnabled) {
  swUpdate.versionUpdates.pipe(
    filter(evt => evt.type === 'VERSION_READY')
  ).subscribe(() => {
    if (confirm('New version available. Update?')) {
      swUpdate.activateUpdate().then(() => location.reload());
    }
  });
}`,
    },
    {
      title: 'ngsw-config.json cache strategies',
      code: `{
  "assetGroups": [{ "name": "app", "installMode": "prefetch", ... }],
  "dataGroups": [{
    "name": "api-freshness",
    "urls": ["/api/**"],
    "cacheConfig": {
      "strategy": "freshness", // try network first
      "maxAge": "1h",
      "timeout": "3s"          // fallback to cache after 3s
    }
  }]
}`,
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. FontOptimizationComponent
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-font-optimization',
  standalone: true,
  template: `
    <div style="padding:1.5rem; background:#e0f7fa; border-radius:8px; margin-bottom:1rem">
      <h3>Font Performance Optimization</h3>

      <div style="display:grid; gap:0.75rem; font-size:0.9rem">
        @for (tip of tips; track tip.title) {
          <div style="background:white; padding:0.75rem; border-radius:4px">
            <strong>{{ tip.title }}</strong>
            <pre style="margin:0.4rem 0 0; font-size:0.8rem; background:#f5f5f5; padding:0.5rem; border-radius:3px; overflow:auto">{{ tip.code }}</pre>
            @if (tip.note) {
              <p style="margin:0.4rem 0 0; font-size:0.8rem; color:#555">{{ tip.note }}</p>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class FontOptimizationComponent {
  tips = [
    {
      title: 'font-display: swap (critical!)',
      code: `@font-face {
  font-family: 'MyFont';
  src: url('/fonts/my-font.woff2') format('woff2');
  font-display: swap; /* show fallback immediately, swap when loaded */
}`,
      note: 'Without swap, browser shows invisible text (FOIT — Flash of Invisible Text)',
    },
    {
      title: 'Self-host instead of Google Fonts CDN',
      code: `<!-- BAD: external request, render-blocking -->
<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet">

<!-- GOOD: self-hosted, preloaded -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>`,
      note: 'google-webfonts-helper.herokuapp.com — download any Google Font',
    },
    {
      title: 'Variable fonts — one file for all weights',
      code: `@font-face {
  font-family: 'InterVar';
  src: url('/fonts/inter-var.woff2') format('woff2');
  font-weight: 100 900;  /* supports any weight in range */
  font-style: normal oblique 0deg 10deg;
  font-display: swap;
}`,
      note: 'Replaces multiple font files (regular, bold, semibold, etc.) with one variable font',
    },
    {
      title: 'System font stack as fallback',
      code: `font-family: 'MyFont', -apple-system, BlinkMacSystemFont,
  'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
  'Fira Sans', 'Droid Sans', 'Helvetica Neue',
  sans-serif;
/* Falls back to OS native font — zero network cost */`,
      note: null,
    },
    {
      title: 'Subset fonts (reduce file size)',
      code: `# Use pyftsubset or glyphhanger to remove unused glyphs:
glyphhanger https://mysite.com --subset=*.woff2

# Or limit to Latin subset via Google Fonts:
https://fonts.googleapis.com/css2?family=Inter&subset=latin`,
      note: 'Can reduce font file size by 70-90% if you only use Latin characters',
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    LazyImageDemoComponent,
    PreconnectInfoComponent,
    BundleAnalysisComponent,
    ServiceWorkerInfoComponent,
    FontOptimizationComponent,
  ],
  template: `
    <div style="font-family:sans-serif; max-width:900px; margin:2rem auto; padding:0 1rem">
      <h1>Phase 7 – Performance Optimization</h1>
      <app-lazy-image-demo />
      <app-preconnect-info />
      <app-bundle-analysis />
      <app-sw-info />
      <app-font-optimization />
    </div>
  `,
})
export class AppComponent {}
