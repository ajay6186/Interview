// Phase 6 - Exercise 04: Performance Optimizations
// Topics: TrackBy, pure pipes, OnPush, virtual scrolling (CdkVirtualScrollViewport),
//         deferrable views (@defer), NgOptimizedImage

import { Component } from '@angular/core';

// ─────────────────────────────────────────────
// TODO 1: TrackBy best practices
//
// Create TrackByDemoComponent with:
// - A list of 1000 items: { id: number; name: string; value: number }
// - "Shuffle" button that re-creates the array (same items, new order)
//
// WITHOUT trackBy:
//   @for (item of items; ...) { <div>...</div> }
//   Angular recreates ALL DOM elements on shuffle
//
// WITH trackBy (Angular 17 @for syntax):
//   @for (item of items; track item.id) { <div>...</div> }
//   Angular patches only changed DOM elements
//
// Also show the older *ngFor syntax for reference:
//   <div *ngFor="let item of items; trackBy: trackById">
//   trackById(index: number, item: Item): number { return item.id; }
// ─────────────────────────────────────────────

// TODO 1: TrackByDemoComponent
// @Component({ ... })
// export class TrackByDemoComponent { }

// ─────────────────────────────────────────────
// TODO 2: @defer — deferrable views
//
// Create DeferDemoComponent that shows:
//
// Basic defer:
//   @defer { <app-heavy-component /> }
//   @placeholder { <span>Loading placeholder...</span> }
//   @loading (minimum 200ms) { <span>Loading...</span> }
//   @error { <span>Failed to load</span> }
//
// Triggers:
//   @defer (on viewport)   — loads when block enters viewport
//   @defer (on interaction) — loads on first user interaction
//   @defer (on idle)       — loads when browser is idle
//   @defer (when condition) — loads when condition is true
//
// Create HeavyComponent as a demo target for @defer
// ─────────────────────────────────────────────

// TODO 2: HeavyComponent + DeferDemoComponent
// @Component({ ... })
// export class DeferDemoComponent { }

// ─────────────────────────────────────────────
// TODO 3: Pure vs Impure Pipe
//
// Create an ImpurePipe:
//   @Pipe({ name: 'impure', pure: false })
//   export class ImpurePipe { ... }
//   ← runs on EVERY change detection cycle
//   ← appropriate for: Date.now(), Math.random(), arrays that mutate
//
// Create a PurePipe:
//   @Pipe({ name: 'currencyFormat', pure: true })  ← default
//   export class CurrencyFormatPipe { ... }
//   ← runs only when INPUT VALUE changes (by reference)
//   ← much better for performance
//
// Create PipeDemoComponent that shows:
// - A counter that triggers frequent CD
// - The impure pipe running many times (counter in transform)
// - The pure pipe running only when input changes
// ─────────────────────────────────────────────

// TODO 3: ImpurePipe + PurePipe + PipeDemoComponent
// @Pipe({ ... })
// export class ImpurePipe { }
// @Pipe({ ... })
// export class PurePipe { }

// ─────────────────────────────────────────────
// TODO 4: Virtual Scrolling with CdkVirtualScrollViewport
//
// Install: @angular/cdk
// Import: ScrollingModule from '@angular/cdk/scrolling'
//
// Create VirtualScrollDemoComponent:
// - Generate 10000 items
// - Use <cdk-virtual-scroll-viewport itemSize="50" style="height: 300px">
//     <div *cdkVirtualFor="let item of items; trackBy: trackById">
//       {{ item.id }}: {{ item.name }}
//     </div>
//   </cdk-virtual-scroll-viewport>
//
// Only the visible items are rendered in DOM (not all 10000)!
// ─────────────────────────────────────────────

// TODO 4: VirtualScrollDemoComponent
// @Component({ ... })
// export class VirtualScrollDemoComponent { }

// ─────────────────────────────────────────────
// TODO 5: NgOptimizedImage
//
// Import NgOptimizedImage from '@angular/common'
//
// Usage:
//   <img ngSrc="path/to/image.jpg" width="800" height="600" priority />
//   <img ngSrc="path/to/image.jpg" width="400" height="300" loading="lazy" />
//
// Benefits:
// - Enforces width + height (prevents layout shift — CLS)
// - Uses loading="lazy" by default (except priority images)
// - Generates srcset automatically for responsive images
// - Warns about missing/wrong dimensions in dev mode
//
// Create NgOptimizedImageDemoComponent showing the usage patterns as a template + code
// ─────────────────────────────────────────────

// TODO 5: NgOptimizedImageDemoComponent
// @Component({ ... })
// export class NgOptimizedImageDemoComponent { }

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
    <h1>Performance Exercise</h1>
    <!-- TODO 6: render components here -->
  `,
})
export class AppComponent {}
