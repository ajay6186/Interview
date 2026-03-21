// Phase 7 - Exercise 01: Angular SSR
// Topics: provideServerRendering, isPlatformBrowser, PLATFORM_ID, TransferState,
//         makeStateKey, withEventReplay, provideClientHydration

import { Component } from '@angular/core';

// ─────────────────────────────────────────────
// TODO 1: PlatformCheckComponent
//
// - Inject PLATFORM_ID: const platformId = inject(PLATFORM_ID)
// - Import isPlatformBrowser from '@angular/common'
// - isBrowser = computed(() => isPlatformBrowser(this.platformId))
// - Template shows: "Running on: Browser" or "Running on: Server"
// - Also show: window, document, navigator availability
//
// IMPORTANT: Never access window/document directly without a platform check —
//   they don't exist on the server and will crash SSR.
// ─────────────────────────────────────────────

// TODO 1: PlatformCheckComponent
// @Component({ ... })
// export class PlatformCheckComponent { }

// ─────────────────────────────────────────────
// TODO 2: TransferStateDemo
//
// Purpose: Server fetches data, serializes to HTML, client reads it (avoids double HTTP call)
//
// - const HEROES_KEY = makeStateKey<Hero[]>('heroes')
//
// On server:
//   if (this.state.hasKey(HEROES_KEY)) { ... } else {
//     const heroes = await fetch(...); // server fetch
//     this.state.set(HEROES_KEY, heroes);
//   }
//
// On browser:
//   if (this.state.hasKey(HEROES_KEY)) {
//     const heroes = this.state.get(HEROES_KEY, []);
//     this.state.remove(HEROES_KEY);  // cleanup
//   } else {
//     // fetch normally (first browser load without SSR, or key expired)
//   }
//
// Inject TransferState with inject(TransferState)
// ─────────────────────────────────────────────

// TODO 2: TransferStateDemoComponent
// @Component({ ... })
// export class TransferStateDemoComponent { }

// ─────────────────────────────────────────────
// TODO 3: SSR-safe DOM access
//
// Show these problematic patterns and their safe alternatives:
//
// BAD (crashes on server):
//   const width = window.innerWidth;           // window is undefined
//   document.getElementById('el').focus();     // document is undefined
//   navigator.userAgent                        // navigator is undefined
//   localStorage.getItem('key')                // localStorage is undefined
//
// GOOD (SSR-safe):
//   if (isPlatformBrowser(platformId)) {
//     const width = window.innerWidth;
//   }
//
// Or use inject(DOCUMENT) instead of document directly:
//   private doc = inject(DOCUMENT);
//   this.doc.getElementById('el')?.focus();
//
// Or use afterNextRender() / afterRender() (Angular 16+):
//   afterNextRender(() => { window.scrollTo(0, 0); });
// ─────────────────────────────────────────────

// TODO 3: SSRSafeAccessComponent
// @Component({ ... })
// export class SSRSafeAccessComponent { }

// ─────────────────────────────────────────────
// TODO 4: HydrationDemo
//
// Show how to enable hydration in main.ts:
//
//   bootstrapApplication(AppComponent, {
//     providers: [
//       provideClientHydration(
//         withEventReplay()  // replay events that happened during hydration
//       ),
//       provideRouter(routes, withEnabledBlockingInitialNavigation()),
//     ]
//   });
//
// Create HydrationDemoComponent that explains:
// - Without hydration: client re-renders from scratch (destroys server HTML)
// - With hydration: client attaches to existing server-rendered DOM nodes (faster)
// - withEventReplay(): records user events during hydration, replays them after
// - Hydration is enabled by default in Angular 17+
// ─────────────────────────────────────────────

// TODO 4: HydrationDemoComponent
// @Component({ ... })
// export class HydrationDemoComponent { }

// ─────────────────────────────────────────────
// TODO 5: SeoService
//
// Create SeoService:
//   - Inject Meta (from '@angular/platform-browser'), Title
//   - updateTitle(title: string): void
//       → this.title.setTitle(title)
//   - updateDescription(desc: string): void
//       → this.meta.updateTag({ name: 'description', content: desc })
//   - updateOgTags(og: { title: string; description: string; image: string; url: string }): void
//       → this.meta.updateTag({ property: 'og:title', content: og.title })
//       → etc.
//   - updateCanonical(url: string): void
//       → inject DOCUMENT, find/create <link rel="canonical">, set href
//
// Create PageComponent that calls SeoService in ngOnInit
// ─────────────────────────────────────────────

// TODO 5: SeoService + PageComponent
// @Injectable({ providedIn: 'root' })
// export class SeoService { }
// @Component({ ... })
// export class PageComponent { }

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
    <h1>Angular SSR Exercise</h1>
    <!-- TODO 6: render components here -->
  `,
})
export class AppComponent {}
