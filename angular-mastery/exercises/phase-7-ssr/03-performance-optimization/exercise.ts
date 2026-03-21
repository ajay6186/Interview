// Phase 7 - Exercise 03: Performance Optimization
// Topics: preloading, defer loading, code splitting, bundle analysis,
//         Intersection Observer, Service Worker, font optimization

import { Component } from '@angular/core';

// ─────────────────────────────────────────────
// TODO 1: LazyImageComponent — Intersection Observer + lazy loading
//
// Create LazyImageComponent:
// - @Input() src: string
// - @Input() alt: string
// - @Input() placeholder = 'data:image/gif;base64,...' (1x1 transparent gif)
// - Use Intersection Observer API in ngAfterViewInit:
//     const observer = new IntersectionObserver(([entry]) => {
//       if (entry.isIntersecting) {
//         this.imgRef.nativeElement.src = this.src;
//         observer.disconnect();
//       }
//     });
//     observer.observe(this.imgRef.nativeElement);
// - Show loading state while not intersected
// - Guard with isPlatformBrowser (SSR-safe)
// ─────────────────────────────────────────────

// TODO 1: LazyImageComponent
// @Component({ ... })
// export class LazyImageComponent { }

// ─────────────────────────────────────────────
// TODO 2: PreconnectExample — DNS prefetch, preconnect hints
//
// Create PreconnectInfoComponent that explains:
//
// In index.html <head>:
//   <link rel="preconnect" href="https://fonts.googleapis.com">
//   <link rel="dns-prefetch" href="https://cdn.example.com">
//   <link rel="preload" href="/hero.jpg" as="image">
//   <link rel="prefetch" href="/about" as="document">
//
// Differences:
//   preconnect  — opens TCP/TLS connection early (high priority, use sparingly)
//   dns-prefetch — resolves DNS only (lower overhead)
//   preload     — fetch resource immediately (LCP image, critical fonts)
//   prefetch    — fetch when browser is idle (next page resources)
//   modulepreload — preload a JS module graph
// ─────────────────────────────────────────────

// TODO 2: PreconnectInfoComponent
// @Component({ ... })
// export class PreconnectInfoComponent { }

// ─────────────────────────────────────────────
// TODO 3: BundleAnalysisComponent
//
// Create a component explaining bundle analysis:
// - ng build --stats-json generates stats.json
// - webpack-bundle-analyzer visualizes chunk sizes
// - Source map explorer: npx source-map-explorer dist/**/*.js
//
// Key things to look for:
// - Large chunks (should be lazy loaded)
// - Duplicate dependencies (same library in multiple chunks)
// - Vendor chunk size (can you remove or replace heavy libraries?)
// - Initial bundle vs lazy chunks ratio
// ─────────────────────────────────────────────

// TODO 3: BundleAnalysisComponent
// @Component({ ... })
// export class BundleAnalysisComponent { }

// ─────────────────────────────────────────────
// TODO 4: ServiceWorkerDemo — @angular/pwa integration pattern
//
// Setup:
//   ng add @angular/pwa
//   → adds ngsw-config.json
//   → registers service worker in app.config.ts
//   → creates manifest.webmanifest
//
// Create a ServiceWorkerInfoComponent showing:
// - How to register: provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode() })
// - Cache strategies: freshness vs performance
// - SwUpdate service: checkForUpdate(), activateUpdate()
// - Show an "Update available" banner when new version detected
// ─────────────────────────────────────────────

// TODO 4: ServiceWorkerInfoComponent
// @Component({ ... })
// export class ServiceWorkerInfoComponent { }

// ─────────────────────────────────────────────
// TODO 5: FontOptimizationComponent — font-display: swap
//
// Show best practices for web font loading:
// - font-display: swap — show fallback font immediately, swap when loaded
// - Self-host fonts instead of Google Fonts CDN for better performance
// - Variable fonts: one file for all weights
// - System font stack as ultimate fallback
// ─────────────────────────────────────────────

// TODO 5: FontOptimizationComponent
// @Component({ ... })
// export class FontOptimizationComponent { }

// ─────────────────────────────────────────────
// TODO 6: Add all components to imports[] in AppComponent
// ─────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO 6: import components here
  ],
  template: `
    <h1>Performance Optimization Exercise</h1>
    <!-- TODO 6: render components here -->
  `,
})
export class AppComponent {}
