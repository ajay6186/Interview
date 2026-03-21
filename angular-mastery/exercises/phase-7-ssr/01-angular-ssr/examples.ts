import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  PLATFORM_ID,
  InjectionToken,
  makeEnvironmentProviders,
} from '@angular/core';
import { isPlatformBrowser, isPlatformServer, DOCUMENT, CommonModule } from '@angular/common';

// ─── BASIC (1–13) ────────────────────────────────────────────────────────────

// Ex01 – PLATFORM_ID injection
@Component({
  selector: 'ex-01',
  standalone: true,
  template: `<p>Ex01 – PLATFORM_ID: {{ platformId }}</p>`,
})
export class Ex01 {
  platformId = inject(PLATFORM_ID);
}

// Ex02 – isPlatformBrowser()
@Component({
  selector: 'ex-02',
  standalone: true,
  template: `<p>Ex02 – isPlatformBrowser: {{ isBrowser }}</p>`,
})
export class Ex02 {
  private platformId = inject(PLATFORM_ID);
  isBrowser = isPlatformBrowser(this.platformId);
}

// Ex03 – isPlatformServer()
@Component({
  selector: 'ex-03',
  standalone: true,
  template: `<p>Ex03 – isPlatformServer: {{ isServer }}</p>`,
})
export class Ex03 {
  private platformId = inject(PLATFORM_ID);
  isServer = isPlatformServer(this.platformId);
}

// Ex04 – Conditional rendering for browser-only
@Component({
  selector: 'ex-04',
  standalone: true,
  template: `
    <p>Ex04 – browser-only rendering:</p>
    @if (isBrowser) {
      <span>This block only renders in the browser.</span>
    } @else {
      <span>Rendered on the server (no browser APIs available).</span>
    }
  `,
})
export class Ex04 {
  private platformId = inject(PLATFORM_ID);
  isBrowser = isPlatformBrowser(this.platformId);
}

// Ex05 – SSR safe guard pattern
@Component({
  selector: 'ex-05',
  standalone: true,
  template: `<p>Ex05 – SSR safe guard: {{ result }}</p>`,
})
export class Ex05 implements OnInit {
  private platformId = inject(PLATFORM_ID);
  result = 'waiting';

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Safe to access window, localStorage, etc.
      this.result = 'browser — window is available';
    } else {
      this.result = 'server — skip browser-only code';
    }
  }
}

// Ex06 – inject(DOCUMENT)
@Component({
  selector: 'ex-06',
  standalone: true,
  template: `<p>Ex06 – inject(DOCUMENT): title = "{{ docTitle }}"</p>`,
})
export class Ex06 {
  private doc = inject(DOCUMENT);
  docTitle = this.doc.title || '(no title set)';
}

// Ex07 – inject(PLATFORM_ID) pattern
@Component({
  selector: 'ex-07',
  standalone: true,
  template: `<p>Ex07 – PLATFORM_ID via inject(): {{ platform }}</p>`,
})
export class Ex07 {
  platform = inject(PLATFORM_ID) as string;
}

// Ex08 – SERVER_CONTEXT token concept
@Component({
  selector: 'ex-08',
  standalone: true,
  template: `
    <p>Ex08 – SERVER_CONTEXT token:</p>
    <pre>
// In server.ts, Angular SSR passes a SERVER_CONTEXT token
// that can carry request-specific data (URL, headers).
// Inject it similarly to PLATFORM_ID when needed server-side.
// export const SERVER_CONTEXT = new InjectionToken('SERVER_CONTEXT');
    </pre>
  `,
})
export class Ex08 {}

// Ex09 – TransferState basics
@Component({
  selector: 'ex-09',
  standalone: true,
  template: `
    <p>Ex09 – TransferState basics:</p>
    <pre>
// TransferState lets the server serialize state into the HTML
// so the browser can rehydrate it without re-fetching.
// Add to app.config.ts:
//   provideClientHydration(withHttpTransferCache())
    </pre>
  `,
})
export class Ex09 {}

// Ex10 – makeStateKey()
@Component({
  selector: 'ex-10',
  standalone: true,
  template: `
    <p>Ex10 – makeStateKey():</p>
    <pre>
import &#123; makeStateKey, TransferState &#125; from '@angular/core';
const USER_KEY = makeStateKey&lt;string&gt;('user');
// Server: transferState.set(USER_KEY, JSON.stringify(user));
// Browser: const cached = transferState.get(USER_KEY, null);
    </pre>
  `,
})
export class Ex10 {}

// Ex11 – SSR-safe localStorage wrapper
@Component({
  selector: 'ex-11',
  standalone: true,
  template: `<p>Ex11 – SSR-safe localStorage: {{ stored }}</p>`,
})
export class Ex11 implements OnInit {
  private platformId = inject(PLATFORM_ID);
  stored = '(server: skipped)';

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('ssr-demo', 'hello');
      this.stored = localStorage.getItem('ssr-demo') ?? 'null';
    }
  }
}

// Ex12 – window is undefined guard
@Component({
  selector: 'ex-12',
  standalone: true,
  template: `<p>Ex12 – window guard: {{ windowStatus }}</p>`,
})
export class Ex12 implements OnInit {
  private platformId = inject(PLATFORM_ID);
  windowStatus = '';

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.windowStatus = `width=${window.innerWidth}`;
    } else {
      this.windowStatus = 'window is undefined on server — guarded safely';
    }
  }
}

// Ex13 – Server-only rendering
@Component({
  selector: 'ex-13',
  standalone: true,
  template: `
    <p>Ex13 – server-only rendering:</p>
    @if (isServer) {
      <span>This content is pre-rendered on the server only.</span>
    }
    @if (!isServer) {
      <span>Browser sees hydrated content.</span>
    }
  `,
})
export class Ex13 {
  private platformId = inject(PLATFORM_ID);
  isServer = isPlatformServer(this.platformId);
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────────────────────

// Ex14 – TransferState.set() on server
@Component({
  selector: 'ex-14',
  standalone: true,
  template: `
    <p>Ex14 – TransferState.set() on server:</p>
    <pre>
import &#123; TransferState, makeStateKey, isPlatformServer &#125; from '@angular/core';
const DATA_KEY = makeStateKey&lt;string[]&gt;('items');

// In server-rendered component:
if (isPlatformServer(platformId)) &#123;
  const items = await fetchData();  // server-side fetch
  transferState.set(DATA_KEY, items);
&#125;
    </pre>
  `,
})
export class Ex14 {}

// Ex15 – TransferState.get() on browser
@Component({
  selector: 'ex-15',
  standalone: true,
  template: `
    <p>Ex15 – TransferState.get() on browser:</p>
    <pre>
const DATA_KEY = makeStateKey&lt;string[]&gt;('items');

// In browser:
if (isPlatformBrowser(platformId)) &#123;
  const cached = transferState.get(DATA_KEY, []);
  if (cached.length) &#123;
    this.items.set(cached);   // skip HTTP call
    transferState.remove(DATA_KEY);
  &#125; else &#123;
    this.http.get('/api/items').subscribe(...);
  &#125;
&#125;
    </pre>
  `,
})
export class Ex15 {}

// Ex16 – HTTP transfer cache (withHttpTransferCache)
@Component({
  selector: 'ex-16',
  standalone: true,
  template: `
    <p>Ex16 – withHttpTransferCache:</p>
    <pre>
// app.config.ts
import &#123; provideClientHydration, withHttpTransferCache &#125; from '@angular/platform-browser';
export const appConfig = &#123;
  providers: [
    provideClientHydration(withHttpTransferCache()),
  ]
&#125;;
// Angular automatically deduplicates HTTP GET calls made on the server.
    </pre>
  `,
})
export class Ex16 {}

// Ex17 – withPrerender
@Component({
  selector: 'ex-17',
  standalone: true,
  template: `
    <p>Ex17 – withPrerender (Static Site Generation):</p>
    <pre>
// app.config.server.ts
import &#123; provideServerRendering &#125; from '@angular/platform-server';
import &#123; withPrerender &#125; from '@angular/ssr';
export const serverConfig = &#123;
  providers: [
    provideServerRendering(),
    withPrerender(&#123; discoverRoutes: true &#125;),
  ]
&#125;;
// Routes are pre-rendered to static HTML at build time.
    </pre>
  `,
})
export class Ex17 {}

// Ex18 – App shell pattern
@Component({
  selector: 'ex-18',
  standalone: true,
  template: `
    <p>Ex18 – App Shell pattern:</p>
    <pre>
// app-shell.component renders a minimal UI (navbar, skeleton)
// that is pre-rendered so users see content before JS loads.
// ng generate app-shell
// In angular.json: "appShell": true under server target.
    </pre>
  `,
})
export class Ex18 {}

// Ex19 – Incremental hydration concept
@Component({
  selector: 'ex-19',
  standalone: true,
  template: `
    <p>Ex19 – Incremental hydration (Angular 17+):</p>
    <pre>
// @defer blocks can be incrementally hydrated —
// only hydrate a component when needed (on:viewport, on:interaction).
// provideClientHydration() enables full-app hydration;
// @defer handles incremental hydration within that context.
    </pre>
  `,
})
export class Ex19 {}

// Ex20 – Full hydration vs partial
@Component({
  selector: 'ex-20',
  standalone: true,
  template: `
    <p>Ex20 – Full hydration vs Partial:</p>
    <pre>
Full hydration (provideClientHydration):
  - Angular reuses server-rendered DOM instead of re-creating it.
  - No flicker; all components hydrated upfront.

Partial / Incremental (@defer + on:viewport):
  - Only hydrate visible/interacted components.
  - Reduces Time-to-Interactive for large pages.
    </pre>
  `,
})
export class Ex20 {}

// Ex21 – SSR error handling
@Component({
  selector: 'ex-21',
  standalone: true,
  template: `
    <p>Ex21 – SSR error handling:</p>
    <pre>
// In server.ts (Express adapter):
server.get('*', (req, res) => &#123;
  commonEngine.render(&#123; ... &#125;)
    .then(html => res.send(html))
    .catch(err => &#123;
      console.error('SSR render error:', err);
      res.status(500).send('Server error');
    &#125;);
&#125;);
    </pre>
  `,
})
export class Ex21 {}

// Ex22 – SSR data prefetch
@Component({
  selector: 'ex-22',
  standalone: true,
  template: `
    <p>Ex22 – SSR data prefetch pattern:</p>
    <pre>
// Use a route resolver that runs on the server:
export const dataResolver: ResolveFn&lt;Item[]&gt; = () =>
  inject(HttpClient).get&lt;Item[]&gt;('/api/items');

// In route config:
&#123; path: 'list', resolve: &#123; items: dataResolver &#125;, component: ListComponent &#125;
// Data is pre-fetched server-side and transferred via TransferState.
    </pre>
  `,
})
export class Ex22 {}

// Ex23 – SSR with provideClientHydration
@Component({
  selector: 'ex-23',
  standalone: true,
  template: `
    <p>Ex23 – provideClientHydration:</p>
    <pre>
// app.config.ts
import &#123; provideClientHydration &#125; from '@angular/platform-browser';
export const appConfig: ApplicationConfig = &#123;
  providers: [
    provideClientHydration(),
    // optionally: provideClientHydration(withHttpTransferCache())
  ]
&#125;;
// Enables DOM hydration: Angular reuses SSR-rendered HTML.
    </pre>
  `,
})
export class Ex23 {}

// Ex24 – Hydration mismatch debugging
@Component({
  selector: 'ex-24',
  standalone: true,
  template: `
    <p>Ex24 – Hydration mismatch debugging:</p>
    <pre>
// Common causes of hydration mismatches:
// 1. Browser-only code in ngOnInit (use isPlatformBrowser guard)
// 2. Date.now() / Math.random() calls differ server vs browser
// 3. User-agent-dependent rendering
// Fix: add ngSkipHydration attribute to affected component:
//   &lt;my-component ngSkipHydration /&gt;
    </pre>
  `,
})
export class Ex24 {}

// Ex25 – SSR route rendering
@Component({
  selector: 'ex-25',
  standalone: true,
  template: `
    <p>Ex25 – SSR route rendering:</p>
    <pre>
// Each URL hit on the server triggers Angular's router to
// match the route and render the component tree to HTML.
// app.config.server.ts provides provideServerRendering()
// which sets up RouterModule for server-side route matching.
    </pre>
  `,
})
export class Ex25 {}

// Ex26 – SSR performance metrics
@Component({
  selector: 'ex-26',
  standalone: true,
  template: `
    <p>Ex26 – SSR performance metrics:</p>
    <pre>
Key SSR metrics:
  TTFB  – Time To First Byte (how fast server sends HTML)
  FCP   – First Contentful Paint (SSR improves this)
  LCP   – Largest Contentful Paint (pre-rendered content)
  TTI   – Time To Interactive (after hydration completes)
// Measure with Chrome DevTools Lighthouse or web-vitals npm package.
    </pre>
  `,
})
export class Ex26 {}

// ─── NESTED (27–38) ──────────────────────────────────────────────────────────

// Ex27 – SSR + signals (isSignalBased)
@Component({
  selector: 'ex-27',
  standalone: true,
  template: `<p>Ex27 – SSR + signals: count = {{ count() }}</p>`,
})
export class Ex27 implements OnInit {
  count = signal(0);
  private platformId = inject(PLATFORM_ID);

  ngOnInit() {
    // Signals work identically on server and browser.
    // The server serializes the rendered HTML with signal values baked in.
    this.count.set(42);
  }
}

// Ex28 – SSR + HTTP deduplication
@Component({
  selector: 'ex-28',
  standalone: true,
  template: `
    <p>Ex28 – SSR + HTTP deduplication:</p>
    <pre>
// With withHttpTransferCache(), any GET made on the server
// is cached in TransferState. The browser picks it up and
// does NOT re-fire the same request.
// Result: zero duplicate HTTP calls on hydration.
    </pre>
  `,
})
export class Ex28 {}

// Ex29 – SSR + lazy routes
@Component({
  selector: 'ex-29',
  standalone: true,
  template: `
    <p>Ex29 – SSR + lazy routes:</p>
    <pre>
// Lazy routes work with SSR. Angular pre-renders the matched route.
&#123;
  path: 'admin',
  loadChildren: () => import('./admin/routes').then(m => m.ADMIN_ROUTES)
&#125;
// On the server, Angular eagerly loads the matched lazy chunk for rendering.
// Unmatched chunks are NOT loaded, keeping server startup fast.
    </pre>
  `,
})
export class Ex29 {}

// Ex30 – SSR + image optimization
@Component({
  selector: 'ex-30',
  standalone: true,
  template: `
    <p>Ex30 – SSR + NgOptimizedImage:</p>
    <pre>
import &#123; NgOptimizedImage &#125; from '@angular/common';
// &lt;img ngSrc="hero.jpg" width="800" height="400" priority /&gt;
// On server: renders &lt;img&gt; with proper width/height attributes.
// Generates preload link hint in &lt;head&gt; for priority images.
// Browser hydrates without layout shift (CLS = 0).
    </pre>
  `,
})
export class Ex30 {}

// Ex31 – SSR + fonts
@Component({
  selector: 'ex-31',
  standalone: true,
  template: `
    <p>Ex31 – SSR + fonts (font inlining):</p>
    <pre>
// angular.json — optimization.fonts.inline: true
// Angular CLI inlines critical Google Fonts CSS into the SSR HTML,
// eliminating a render-blocking network request.
// Result: faster FCP as fonts are available immediately.
    </pre>
  `,
})
export class Ex31 {}

// Ex32 – SSR + third-party script guard
@Component({
  selector: 'ex-32',
  standalone: true,
  template: `<p>Ex32 – SSR third-party script guard: loaded={{ loaded }}</p>`,
})
export class Ex32 implements OnInit {
  private platformId = inject(PLATFORM_ID);
  loaded = false;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Only inject third-party scripts in the browser
      const script = document.createElement('script');
      script.src = 'https://example.com/widget.js';
      script.async = true;
      document.head.appendChild(script);
      this.loaded = true;
    }
    // On server: skip entirely — avoid ReferenceError on window/document
  }
}

// Ex33 – SSR + cookie handling
@Component({
  selector: 'ex-33',
  standalone: true,
  template: `
    <p>Ex33 – SSR + cookie handling:</p>
    <pre>
// Server: read cookies from the Express Request object
// (injected via custom DI token in server.ts):
server.get('*', (req, res) => &#123;
  const authToken = req.cookies['auth_token'];
  commonEngine.render(&#123;
    providers: [&#123; provide: AUTH_TOKEN, useValue: authToken &#125;]
  &#125;);
&#125;);
// Browser: document.cookie is available normally.
    </pre>
  `,
})
export class Ex33 {}

// Ex34 – SSR + auth state transfer
@Component({
  selector: 'ex-34',
  standalone: true,
  template: `
    <p>Ex34 – SSR + auth state transfer:</p>
    <pre>
const AUTH_KEY = makeStateKey&lt;&#123; id: number; role: string &#125;&gt;('auth');

// Server:
const user = verifyToken(req.cookies.token);
transferState.set(AUTH_KEY, user);

// Browser:
const user = transferState.get(AUTH_KEY, null);
if (user) authService.setUser(user);
transferState.remove(AUTH_KEY);
    </pre>
  `,
})
export class Ex34 {}

// Ex35 – SSR meta tags
@Component({
  selector: 'ex-35',
  standalone: true,
  template: `
    <p>Ex35 – SSR meta tags (rendered server-side for SEO bots):</p>
    <pre>
import &#123; Meta, Title &#125; from '@angular/platform-browser';
// In component:
private meta = inject(Meta);
private title = inject(Title);
ngOnInit() &#123;
  this.title.setTitle('My Page – Brand');
  this.meta.updateTag(&#123; name: 'description', content: 'Page description' &#125;);
&#125;
// Both Title and Meta work on the server — bots see them in raw HTML.
    </pre>
  `,
})
export class Ex35 {}

// Ex36 – SSR open graph tags
@Component({
  selector: 'ex-36',
  standalone: true,
  template: `
    <p>Ex36 – SSR Open Graph tags:</p>
    <pre>
private meta = inject(Meta);
ngOnInit() &#123;
  this.meta.addTags([
    &#123; property: 'og:title', content: 'Product Name' &#125;,
    &#123; property: 'og:description', content: 'Product description' &#125;,
    &#123; property: 'og:image', content: 'https://cdn.example.com/img.jpg' &#125;,
    &#123; property: 'og:url', content: 'https://example.com/products/123' &#125;,
  ]);
&#125;
// OG tags are critical for social sharing previews — must be in SSR HTML.
    </pre>
  `,
})
export class Ex36 {}

// Ex37 – SSR canonical URL
@Component({
  selector: 'ex-37',
  standalone: true,
  template: `
    <p>Ex37 – SSR canonical URL:</p>
    <pre>
private doc = inject(DOCUMENT);
ngOnInit() &#123;
  let link = this.doc.querySelector('link[rel=canonical]') as HTMLLinkElement;
  if (!link) &#123;
    link = this.doc.createElement('link');
    link.setAttribute('rel', 'canonical');
    this.doc.head.appendChild(link);
  &#125;
  link.setAttribute('href', 'https://example.com/current-path');
&#125;
// On the server, DOCUMENT is the server-side DOM — canonical is in raw HTML.
    </pre>
  `,
})
export class Ex37 {}

// Ex38 – SSR structured data (JSON-LD)
@Component({
  selector: 'ex-38',
  standalone: true,
  template: `
    <p>Ex38 – SSR JSON-LD structured data:</p>
    <pre>
private doc = inject(DOCUMENT);
ngOnInit() &#123;
  const script = this.doc.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify(&#123;
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Widget Pro',
    price: '29.99',
  &#125;);
  this.doc.head.appendChild(script);
&#125;
// JSON-LD is injected server-side so crawlers parse structured data.
    </pre>
  `,
})
export class Ex38 {}

// ─── ADVANCED (39–50) ────────────────────────────────────────────────────────

// Ex39 – SSR with Node.js Express server
@Component({
  selector: 'ex-39',
  standalone: true,
  template: `
    <p>Ex39 – SSR with Express server:</p>
    <pre>
// server.ts
import express from 'express';
import &#123; CommonEngine &#125; from '@angular/ssr';
import bootstrap from './main.server';

const server = express();
const engine = new CommonEngine();
server.get('*', async (req, res) => &#123;
  const html = await engine.render(&#123;
    bootstrap,
    documentFilePath: indexHtml,
    url: req.originalUrl,
    publicPath: distFolder,
  &#125;);
  res.send(html);
&#125;);
server.listen(4000);
    </pre>
  `,
})
export class Ex39 {}

// Ex40 – SSR with edge rendering
@Component({
  selector: 'ex-40',
  standalone: true,
  template: `
    <p>Ex40 – SSR with edge rendering:</p>
    <pre>
// Edge rendering runs SSR at CDN edge nodes (Vercel Edge, Cloudflare Workers).
// Angular SSR output can target edge runtimes by using the fetch-based adapter.
// ng add @angular/ssr --server-routing
// In vercel.json: "runtime": "edge"
// Benefits: global low-latency rendering without a centralized server.
// Limitations: no Node.js built-ins; use Web Crypto, fetch APIs only.
    </pre>
  `,
})
export class Ex40 {}

// Ex41 – SSR incremental static regeneration concept
@Component({
  selector: 'ex-41',
  standalone: true,
  template: `
    <p>Ex41 – ISR (Incremental Static Regeneration) concept:</p>
    <pre>
// ISR = pre-render pages at build time, re-generate stale ones on-demand.
// Angular SSR + CDN cache with revalidation headers:
//   Cache-Control: s-maxage=60, stale-while-revalidate=3600
// Vercel ISR: export revalidate = 60 (seconds before re-render).
// Result: static-speed HTML, always fresh after revalidation window.
    </pre>
  `,
})
export class Ex41 {}

// Ex42 – SSR streaming
@Component({
  selector: 'ex-42',
  standalone: true,
  template: `
    <p>Ex42 – SSR streaming:</p>
    <pre>
// HTTP streaming sends HTML in chunks as Angular renders each component tree.
// Enables browser to parse &lt;head&gt; and start loading assets
// before the full page is rendered.
// Angular 17+ CommonEngine supports renderToPipeableStream (experimental).
// In Express: res.write(chunk) as each @defer block resolves.
    </pre>
  `,
})
export class Ex42 {}

// Ex43 – SSR with database on server
@Component({
  selector: 'ex-43',
  standalone: true,
  template: `
    <p>Ex43 – SSR with database access:</p>
    <pre>
// Provide a DB service only in server context:
// app.config.server.ts:
providers: [
  &#123; provide: DataService, useClass: ServerDataService &#125;
]
// ServerDataService queries DB directly (no HTTP round-trip).
// Serialize result into TransferState so browser reuses it.
// Never expose DB credentials to the browser bundle.
    </pre>
  `,
})
export class Ex43 {}

// Ex44 – SSR cache strategies (CDN)
@Component({
  selector: 'ex-44',
  standalone: true,
  template: `
    <p>Ex44 – SSR + CDN cache strategies:</p>
    <pre>
// In Express server.ts, set cache headers per route:
if (req.url.startsWith('/static/')) &#123;
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
&#125; else if (req.url.startsWith('/blog/')) &#123;
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
&#125; else &#123;
  res.setHeader('Cache-Control', 'no-store'); // authenticated pages
&#125;
    </pre>
  `,
})
export class Ex44 {}

// Ex45 – SSR environment config
@Component({
  selector: 'ex-45',
  standalone: true,
  template: `
    <p>Ex45 – SSR environment config:</p>
    <pre>
// environments/environment.server.ts
export const environment = &#123;
  production: true,
  apiUrl: process.env['API_URL'] ?? 'http://localhost:3000',
  isServer: true,
&#125;;
// In server.ts, Node.js process.env is available.
// Never expose server secrets (DB passwords) in browser environment files.
// Use Angular's APP_INITIALIZER on the server to load config from env.
    </pre>
  `,
})
export class Ex45 {}

// Ex46 – SSR error boundaries
@Component({
  selector: 'ex-46',
  standalone: true,
  template: `
    <p>Ex46 – SSR error boundaries:</p>
    <pre>
// Angular does not have React-style error boundaries,
// but you can implement a safe wrapper:
@Component(&#123; template: '&lt;ng-content /&gt;' &#125;)
class SafeWrapperComponent implements OnInit &#123;
  ngOnInit() &#123;
    // Catch errors in this subtree
  &#125;
&#125;
// On server: wrap render in try/catch, fall back to client-side rendering.
// In Express: if SSR throws, send the empty shell and let browser render.
    </pre>
  `,
})
export class Ex46 {}

// Ex47 – SSR with WebSockets (SSE only)
@Component({
  selector: 'ex-47',
  standalone: true,
  template: `
    <p>Ex47 – SSR with real-time (SSE only on server):</p>
    <pre>
// WebSockets cannot be used in SSR (no persistent connection during render).
// Server-Sent Events (SSE) for one-way streams after hydration:
//   isPlatformBrowser check before connecting EventSource.
// Strategy: pre-render initial data via SSR TransferState,
// then connect SSE in browser ngOnInit for live updates.
    </pre>
  `,
})
export class Ex47 {}

// Ex48 – SSR with i18n
@Component({
  selector: 'ex-48',
  standalone: true,
  template: `
    <p>Ex48 – SSR with i18n:</p>
    <pre>
// Angular i18n: build separate bundles per locale.
// ng build --localize
// Each locale gets its own server entry point.
// In Express, detect locale from Accept-Language header or URL (/en/, /fr/):
const locale = req.acceptsLanguages(['en', 'fr']) ?? 'en';
const bootstrap = locale === 'fr' ? bootstrapFr : bootstrapEn;
engine.render(&#123; bootstrap, providers: [&#123; provide: LOCALE_ID, useValue: locale &#125;] &#125;);
    </pre>
  `,
})
export class Ex48 {}

// Ex49 – Deploy SSR to Vercel/Netlify concept
@Component({
  selector: 'ex-49',
  standalone: true,
  template: `
    <p>Ex49 – Deploy SSR to Vercel / Netlify:</p>
    <pre>
// Vercel:
//   npm i -g vercel && vercel
//   Angular SSR detected automatically via @angular/ssr adapter.
//   Output: serverless functions per route.

// Netlify:
//   npm install @netlify/angular-runtime
//   netlify.toml: [build] command = "ng build"
//   Angular SSR runs as Netlify Functions.

// Both support TransferState, route pre-rendering, and CDN edge caching.
    </pre>
  `,
})
export class Ex49 {}

// Ex50 – Full SSR + hydration + transfer state app
@Component({
  selector: 'ex-50',
  standalone: true,
  template: `
    <p>Ex50 – Full SSR + hydration + TransferState pattern:</p>
    <pre>
// 1. app.config.ts
//    provideClientHydration(withHttpTransferCache())

// 2. Server fetches data, sets TransferState key
//    const KEY = makeStateKey&lt;Item[]&gt;('items');
//    if (isServer) &#123; ts.set(KEY, await fetchItems()); &#125;

// 3. Component reads from cache or HTTP
//    const cached = ts.get(KEY, null);
//    this.items.set(cached ?? await lastValueFrom(http.get(...)));
//    ts.remove(KEY);

// 4. Browser reuses server DOM via provideClientHydration()
//    No DOM flicker, no duplicate HTTP calls.

// 5. Signals drive all reactive updates post-hydration.
    </pre>
  `,
})
export class Ex50 {}

// ─── AppComponent ─────────────────────────────────────────────────────────────

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
    <h2>Phase 7 – Angular SSR (Angular Universal)</h2>

    <h4>Ex01 – PLATFORM_ID injection</h4><ex-01 /><hr />
    <h4>Ex02 – isPlatformBrowser()</h4><ex-02 /><hr />
    <h4>Ex03 – isPlatformServer()</h4><ex-03 /><hr />
    <h4>Ex04 – Conditional rendering for browser-only</h4><ex-04 /><hr />
    <h4>Ex05 – SSR safe guard pattern</h4><ex-05 /><hr />
    <h4>Ex06 – inject(DOCUMENT)</h4><ex-06 /><hr />
    <h4>Ex07 – inject(PLATFORM_ID) pattern</h4><ex-07 /><hr />
    <h4>Ex08 – SERVER_CONTEXT token</h4><ex-08 /><hr />
    <h4>Ex09 – TransferState basics</h4><ex-09 /><hr />
    <h4>Ex10 – makeStateKey()</h4><ex-10 /><hr />
    <h4>Ex11 – SSR-safe localStorage wrapper</h4><ex-11 /><hr />
    <h4>Ex12 – window is undefined guard</h4><ex-12 /><hr />
    <h4>Ex13 – Server-only rendering</h4><ex-13 /><hr />
    <h4>Ex14 – TransferState.set() on server</h4><ex-14 /><hr />
    <h4>Ex15 – TransferState.get() on browser</h4><ex-15 /><hr />
    <h4>Ex16 – HTTP transfer cache (withHttpTransferCache)</h4><ex-16 /><hr />
    <h4>Ex17 – withPrerender</h4><ex-17 /><hr />
    <h4>Ex18 – App shell pattern</h4><ex-18 /><hr />
    <h4>Ex19 – Incremental hydration concept</h4><ex-19 /><hr />
    <h4>Ex20 – Full hydration vs partial</h4><ex-20 /><hr />
    <h4>Ex21 – SSR error handling</h4><ex-21 /><hr />
    <h4>Ex22 – SSR data prefetch</h4><ex-22 /><hr />
    <h4>Ex23 – SSR with provideClientHydration</h4><ex-23 /><hr />
    <h4>Ex24 – Hydration mismatch debugging</h4><ex-24 /><hr />
    <h4>Ex25 – SSR route rendering</h4><ex-25 /><hr />
    <h4>Ex26 – SSR performance metrics</h4><ex-26 /><hr />
    <h4>Ex27 – SSR + signals</h4><ex-27 /><hr />
    <h4>Ex28 – SSR + HTTP deduplication</h4><ex-28 /><hr />
    <h4>Ex29 – SSR + lazy routes</h4><ex-29 /><hr />
    <h4>Ex30 – SSR + image optimization</h4><ex-30 /><hr />
    <h4>Ex31 – SSR + fonts</h4><ex-31 /><hr />
    <h4>Ex32 – SSR + third-party script guard</h4><ex-32 /><hr />
    <h4>Ex33 – SSR + cookie handling</h4><ex-33 /><hr />
    <h4>Ex34 – SSR + auth state transfer</h4><ex-34 /><hr />
    <h4>Ex35 – SSR meta tags</h4><ex-35 /><hr />
    <h4>Ex36 – SSR open graph tags</h4><ex-36 /><hr />
    <h4>Ex37 – SSR canonical URL</h4><ex-37 /><hr />
    <h4>Ex38 – SSR structured data (JSON-LD)</h4><ex-38 /><hr />
    <h4>Ex39 – SSR with Node.js Express server</h4><ex-39 /><hr />
    <h4>Ex40 – SSR with edge rendering</h4><ex-40 /><hr />
    <h4>Ex41 – SSR incremental static regeneration concept</h4><ex-41 /><hr />
    <h4>Ex42 – SSR streaming</h4><ex-42 /><hr />
    <h4>Ex43 – SSR with database on server</h4><ex-43 /><hr />
    <h4>Ex44 – SSR cache strategies (CDN)</h4><ex-44 /><hr />
    <h4>Ex45 – SSR environment config</h4><ex-45 /><hr />
    <h4>Ex46 – SSR error boundaries</h4><ex-46 /><hr />
    <h4>Ex47 – SSR with WebSockets (SSE only)</h4><ex-47 /><hr />
    <h4>Ex48 – SSR with i18n</h4><ex-48 /><hr />
    <h4>Ex49 – Deploy SSR to Vercel/Netlify concept</h4><ex-49 /><hr />
    <h4>Ex50 – Full SSR + hydration + transfer state app</h4><ex-50 /><hr />
  `,
})
export class AppComponent {}
