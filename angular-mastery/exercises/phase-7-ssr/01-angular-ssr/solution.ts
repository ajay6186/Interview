// Phase 7 - Solution 01: Angular SSR
// Topics: provideServerRendering, isPlatformBrowser, PLATFORM_ID, TransferState,
//         makeStateKey, withEventReplay, provideClientHydration

import {
  Component, signal, computed, inject, Injectable, OnInit, PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';

// ─────────────────────────────────────────────────────────────────────────────
// SSR setup (shown in comments — lives in server.ts and main.ts)
// ─────────────────────────────────────────────────────────────────────────────

/*
// app.config.ts (browser):
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { withEnabledBlockingInitialNavigation } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withEnabledBlockingInitialNavigation()),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),  // use fetch API (works in both environments)
  ],
};

// app.config.server.ts (server):
import { mergeApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';

export const serverConfig: ApplicationConfig = mergeApplicationConfig(appConfig, {
  providers: [
    provideServerRendering(),
    // Server-specific providers go here
  ],
});
*/

// ─────────────────────────────────────────────────────────────────────────────
// 1. PlatformCheckComponent — isPlatformBrowser
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-platform-check',
  standalone: true,
  template: `
    <div style="padding:1.5rem; background:#e3f2fd; border-radius:8px; margin-bottom:1rem">
      <h3>Platform Detection</h3>

      <div [style.background]="isBrowser ? '#c8e6c9' : '#fff9c4'"
           style="padding:0.75rem; border-radius:4px; margin-bottom:0.75rem">
        <strong>Running on: {{ isBrowser ? 'Browser' : 'Server (SSR)' }}</strong>
      </div>

      <table style="width:100%; border-collapse:collapse; font-size:0.9rem">
        <thead>
          <tr style="background:#1565c0; color:white">
            <th style="padding:0.4rem">API</th>
            <th style="padding:0.4rem">Available?</th>
            <th style="padding:0.4rem">Safe access pattern</th>
          </tr>
        </thead>
        <tbody>
          @for (row of platformRows; track row.api) {
            <tr style="border-bottom:1px solid #ddd">
              <td style="padding:0.4rem"><code>{{ row.api }}</code></td>
              <td style="padding:0.4rem; text-align:center">
                <span [style.color]="isBrowser ? '#2e7d32' : '#c62828'">
                  {{ isBrowser ? '✓' : '✗' }}
                </span>
              </td>
              <td style="padding:0.4rem; font-size:0.8rem; color:#555">{{ row.safe }}</td>
            </tr>
          }
        </tbody>
      </table>

      <div style="margin-top:0.75rem; font-size:0.85rem; background:#e8f5e9; padding:0.75rem; border-radius:4px">
        <pre style="margin:0; font-size:0.8rem">{{ platformCode }}</pre>
      </div>
    </div>
  `,
})
export class PlatformCheckComponent {
  private platformId = inject(PLATFORM_ID);
  isBrowser = isPlatformBrowser(this.platformId);

  platformRows = [
    { api: 'window',        safe: 'if (isPlatformBrowser(platformId)) { window.xxx }' },
    { api: 'document',      safe: 'inject(DOCUMENT) — works on both server and browser' },
    { api: 'localStorage',  safe: 'Guard with isPlatformBrowser() or use afterNextRender()' },
    { api: 'navigator',     safe: 'isPlatformBrowser() guard' },
    { api: 'fetch/XMLHttpRequest', safe: 'Use HttpClient with provideHttpClient(withFetch())' },
  ];

  platformCode = `
const platformId = inject(PLATFORM_ID);
const isBrowser = isPlatformBrowser(platformId);

if (isBrowser) {
  // Safe to use window, localStorage, etc.
  const width = window.innerWidth;
}

// Alternative: inject(DOCUMENT) — SSR-safe
const doc = inject(DOCUMENT);
doc.getElementById('myEl')?.focus();

// Alternative: afterNextRender — only runs in browser
afterNextRender(() => {
  window.scrollTo(0, 0);
});`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. TransferStateDemo
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-transfer-state-demo',
  standalone: true,
  template: `
    <div style="padding:1.5rem; background:#fff3e0; border-radius:8px; margin-bottom:1rem">
      <h3>TransferState — Avoid Double HTTP Calls</h3>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; font-size:0.9rem">
        <div style="background:#ffcdd2; padding:0.75rem; border-radius:4px">
          <strong>Without TransferState (BAD)</strong>
          <ol style="margin:0.5rem 0 0; padding-left:1.25rem">
            <li>Server renders HTML, fetches data (HTTP call #1)</li>
            <li>HTML sent to client</li>
            <li>Angular hydrates</li>
            <li>ngOnInit runs again → HTTP call #2 (duplicate!)</li>
            <li>Brief flash as data is re-fetched</li>
          </ol>
        </div>
        <div style="background:#c8e6c9; padding:0.75rem; border-radius:4px">
          <strong>With TransferState (GOOD)</strong>
          <ol style="margin:0.5rem 0 0; padding-left:1.25rem">
            <li>Server fetches data (HTTP call #1), sets TransferState key</li>
            <li>State is serialized into the HTML as JSON</li>
            <li>Angular hydrates</li>
            <li>ngOnInit checks TransferState key → reads from state (no HTTP!)</li>
            <li>State key removed to free memory</li>
          </ol>
        </div>
      </div>

      <pre style="margin-top:0.75rem; background:#1e1e1e; color:#d4d4d4; padding:0.75rem;
                  border-radius:4px; font-size:0.8rem; overflow:auto">{{ transferStateCode }}</pre>
    </div>
  `,
})
export class TransferStateDemoComponent {
  transferStateCode = `
import { TransferState, makeStateKey } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const HEROES_KEY = makeStateKey<Hero[]>('heroes');

@Component({ ... })
export class HeroListComponent implements OnInit {
  private state      = inject(TransferState);
  private http       = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  heroes = signal<Hero[]>([]);

  ngOnInit() {
    if (this.state.hasKey(HEROES_KEY)) {
      // Read from server-rendered state (no HTTP call)
      this.heroes.set(this.state.get(HEROES_KEY, []));
      this.state.remove(HEROES_KEY);  // free memory

    } else {
      // Normal HTTP call (first load or after state expires)
      this.http.get<Hero[]>('/api/heroes').subscribe(h => {
        this.heroes.set(h);
        if (!isPlatformBrowser(this.platformId)) {
          // On server: save to state for client to read
          this.state.set(HEROES_KEY, h);
        }
      });
    }
  }
}`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SSR-safe DOM access
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-ssr-safe',
  standalone: true,
  template: `
    <div style="padding:1.5rem; background:#e8f5e9; border-radius:8px; margin-bottom:1rem">
      <h3>SSR-Safe DOM Access Patterns</h3>

      <div style="display:grid; gap:0.75rem; font-size:0.85rem">
        @for (pattern of patterns; track pattern.title) {
          <div [style.background]="pattern.bad ? '#ffebee' : '#e8f5e9'"
               style="padding:0.75rem; border-radius:4px">
            <strong [style.color]="pattern.bad ? '#c62828' : '#2e7d32'">
              {{ pattern.bad ? '✗ BAD' : '✓ GOOD' }} — {{ pattern.title }}
            </strong>
            <pre style="margin:0.4rem 0 0; background:#1e1e1e; color:#d4d4d4; padding:0.5rem;
                        border-radius:3px; font-size:0.78rem; overflow:auto">{{ pattern.code }}</pre>
          </div>
        }
      </div>
    </div>
  `,
})
export class SSRSafeComponent {
  patterns = [
    {
      bad: true,
      title: 'Direct window access (crashes on server)',
      code: `const width = window.innerWidth;       // ReferenceError: window is not defined
document.getElementById('el').focus();  // same issue`,
    },
    {
      bad: false,
      title: 'isPlatformBrowser guard',
      code: `const platformId = inject(PLATFORM_ID);
if (isPlatformBrowser(platformId)) {
  const width = window.innerWidth;
  localStorage.setItem('key', 'value');
}`,
    },
    {
      bad: false,
      title: 'inject(DOCUMENT) — works on both platforms',
      code: `// In SSR, DOCUMENT is a server DOM implementation
const doc = inject(DOCUMENT);
const el = doc.getElementById('myId');
el?.focus();`,
    },
    {
      bad: false,
      title: 'afterNextRender() — browser-only lifecycle',
      code: `import { afterNextRender } from '@angular/core';

constructor() {
  afterNextRender(() => {
    // Only runs in browser, after first render
    window.scrollTo(0, 0);
    this.chart = new ChartLibrary(this.canvas.nativeElement);
  });
}`,
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. HydrationDemo
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-hydration-demo',
  standalone: true,
  template: `
    <div style="padding:1.5rem; background:#f3e5f5; border-radius:8px; margin-bottom:1rem">
      <h3>Client Hydration</h3>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; font-size:0.9rem">
        <div style="background:#ffcdd2; padding:0.75rem; border-radius:4px">
          <strong>Without hydration</strong>
          <p style="margin:0.4rem 0 0">
            Client destroys server HTML and re-renders from scratch.
            Causes layout flash (Cumulative Layout Shift).
          </p>
        </div>
        <div style="background:#c8e6c9; padding:0.75rem; border-radius:4px">
          <strong>With provideClientHydration()</strong>
          <p style="margin:0.4rem 0 0">
            Client attaches Angular change detection to existing server DOM.
            No re-render = no layout shift = better LCP score.
          </p>
        </div>
      </div>

      <pre style="margin-top:0.75rem; background:#1e1e1e; color:#d4d4d4; padding:0.75rem;
                  border-radius:4px; font-size:0.8rem; overflow:auto">{{ hydrationCode }}</pre>
    </div>
  `,
})
export class HydrationDemoComponent {
  hydrationCode = `
// app.config.ts
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    // Enabled by default in Angular 17+ via ng new --ssr
    provideClientHydration(
      withEventReplay()  // capture & replay user events during hydration gap
    ),
  ],
};

// withEventReplay: if user clicks a button during hydration,
// the click is recorded and replayed once Angular takes over.

// To opt a component OUT of hydration (e.g. third-party DOM):
// @Component({ ... }) + ngSkipHydration attribute:
// <app-third-party ngSkipHydration />`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. SeoService + PageComponent
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class SeoService {
  // In real app: inject Meta and Title from '@angular/platform-browser'
  // private meta  = inject(Meta);
  // private title = inject(Title);
  // private doc   = inject(DOCUMENT);

  updateTitle(title: string): void {
    // this.title.setTitle(title);
    document.title = title; // demo-only
    console.log('[SEO] Title:', title);
  }

  updateDescription(desc: string): void {
    // this.meta.updateTag({ name: 'description', content: desc });
    console.log('[SEO] Description:', desc);
  }

  updateOgTags(og: { title: string; description: string; image: string; url: string }): void {
    /*
    this.meta.updateTag({ property: 'og:title',       content: og.title });
    this.meta.updateTag({ property: 'og:description', content: og.description });
    this.meta.updateTag({ property: 'og:image',       content: og.image });
    this.meta.updateTag({ property: 'og:url',         content: og.url });
    this.meta.updateTag({ property: 'og:type',        content: 'website' });
    */
    console.log('[SEO] OG tags:', og);
  }

  updateCanonical(url: string): void {
    /*
    const head = this.doc.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', url);
    */
    console.log('[SEO] Canonical:', url);
  }
}

@Component({
  selector: 'app-seo-page',
  standalone: true,
  template: `
    <div style="padding:1.5rem; background:#e8eaf6; border-radius:8px; margin-bottom:1rem">
      <h3>SeoService</h3>
      <div style="font-size:0.9rem; background:white; padding:0.75rem; border-radius:4px; margin-bottom:0.75rem">
        <p style="margin:0"><strong>Current meta (simulated):</strong></p>
        <p style="margin:0.25rem 0">Title: <em>{{ meta().title }}</em></p>
        <p style="margin:0.25rem 0">Description: <em>{{ meta().description }}</em></p>
        <p style="margin:0.25rem 0">OG Image: <em>{{ meta().image }}</em></p>
        <p style="margin:0">Canonical: <em>{{ meta().canonical }}</em></p>
      </div>
      <p style="font-size:0.85rem; color:#555">
        In a real app, SeoService is called in ngOnInit of each page component.
        This ensures meta tags are correct on every navigation (important for SSR + social sharing).
      </p>
      <pre style="background:#1e1e1e; color:#d4d4d4; padding:0.75rem; border-radius:4px; font-size:0.8rem; overflow:auto">{{ code }}</pre>
    </div>
  `,
})
export class SeoDemoComponent implements OnInit {
  private seo = inject(SeoService);
  meta = signal({ title: '', description: '', image: '', canonical: '' });

  ngOnInit() {
    this.seo.updateTitle('My Product Page | MyApp');
    this.seo.updateDescription('Buy the best Angular course online — 100+ hours of content.');
    this.seo.updateOgTags({
      title:       'My Product Page',
      description: 'Buy the best Angular course online.',
      image:       'https://example.com/og-image.jpg',
      url:         'https://example.com/products/angular-course',
    });
    this.seo.updateCanonical('https://example.com/products/angular-course');

    this.meta.set({
      title:     'My Product Page | MyApp',
      description: 'Buy the best Angular course online — 100+ hours of content.',
      image:     'https://example.com/og-image.jpg',
      canonical: 'https://example.com/products/angular-course',
    });
  }

  code = `
// In a real page component:
ngOnInit() {
  this.route.data.subscribe(data => {
    const product = data['product'];
    this.seo.updateTitle(product.name + ' | MyShop');
    this.seo.updateDescription(product.description);
    this.seo.updateOgTags({
      title: product.name,
      description: product.description,
      image: product.imageUrl,
      url: this.router.url,
    });
    this.seo.updateCanonical('https://myshop.com' + this.router.url);
  });
}`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    PlatformCheckComponent,
    TransferStateDemoComponent,
    SSRSafeComponent,
    HydrationDemoComponent,
    SeoDemoComponent,
  ],
  template: `
    <div style="font-family:sans-serif; max-width:900px; margin:2rem auto; padding:0 1rem">
      <h1>Phase 7 – Angular SSR</h1>
      <app-platform-check />
      <app-transfer-state-demo />
      <app-ssr-safe />
      <app-hydration-demo />
      <app-seo-page />
    </div>
  `,
})
export class AppComponent {}
