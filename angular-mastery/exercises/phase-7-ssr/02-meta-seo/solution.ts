// Phase 7 - Solution 02: Meta & SEO
// Topics: Meta service, Title service, Open Graph tags, canonical links, structured data

import {
  Component, signal, inject, Injectable, OnInit, OnDestroy
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────

interface OgData {
  title:       string;
  description: string;
  image:       string;
  url:         string;
  type?:       string;
}

interface TwitterCardData {
  card:    'summary' | 'summary_large_image';
  title:   string;
  description: string;
  image?:  string;
  site?:   string;  // @handle
}

interface MetaTagEntry { selector: string; content: string; }

// ─────────────────────────────────────────────────────────────────────────────
// 1. SeoService
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class SeoService {
  // Real: inject(Meta) and inject(Title) from '@angular/platform-browser'
  // Using a signal-based store for demo purposes
  private _currentTitle = signal('');
  private _currentTags  = signal<MetaTagEntry[]>([]);
  private _doc          = inject(DOCUMENT);

  get currentTitle()  { return this._currentTitle.asReadonly(); }
  get currentTags()   { return this._currentTags.asReadonly(); }

  updateTitle(title: string): void {
    // Real: this.titleService.setTitle(title)
    this._currentTitle.set(title);
    this._doc.title = title;
  }

  updateDescription(desc: string): void {
    // Real: this.meta.updateTag({ name: 'description', content: desc })
    this.setTag("name='description'", desc);
  }

  updateOgTags(data: OgData): void {
    /*
    // REAL:
    this.meta.updateTag({ property: 'og:title',       content: data.title });
    this.meta.updateTag({ property: 'og:description', content: data.description });
    this.meta.updateTag({ property: 'og:image',       content: data.image });
    this.meta.updateTag({ property: 'og:url',         content: data.url });
    this.meta.updateTag({ property: 'og:type',        content: data.type ?? 'website' });
    */
    this.setTag("property='og:title'",       data.title);
    this.setTag("property='og:description'", data.description);
    this.setTag("property='og:image'",       data.image);
    this.setTag("property='og:url'",         data.url);
    this.setTag("property='og:type'",        data.type ?? 'website');
  }

  updateTwitterCard(data: TwitterCardData): void {
    this.setTag("name='twitter:card'",        data.card);
    this.setTag("name='twitter:title'",       data.title);
    this.setTag("name='twitter:description'", data.description);
    if (data.image) this.setTag("name='twitter:image'", data.image);
    if (data.site)  this.setTag("name='twitter:site'",  data.site);
  }

  removeTag(selector: string): void {
    // Real: this.meta.removeTag(selector)
    this._currentTags.update(tags => tags.filter(t => t.selector !== selector));
  }

  private setTag(selector: string, content: string): void {
    this._currentTags.update(tags => {
      const existing = tags.find(t => t.selector === selector);
      if (existing) {
        return tags.map(t => t.selector === selector ? { selector, content } : t);
      }
      return [...tags, { selector, content }];
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ProductPageComponent
// ─────────────────────────────────────────────────────────────────────────────

interface Product {
  id: number; name: string; price: number; description: string;
  image: string; category: string;
}

const DEMO_PRODUCT: Product = {
  id: 1,
  name: 'Complete Angular 17 Course',
  price: 49.99,
  description: 'Master Angular 17 with signals, NgRx, SSR, and more. 100+ hours of content.',
  image: 'https://via.placeholder.com/400x200?text=Angular+17',
  category: 'Online Courses',
};

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div style="padding:1.5rem; background:#e8f5e9; border-radius:8px; margin-bottom:1rem">
      <h3>ProductPageComponent (calls SeoService on init)</h3>

      <div style="display:flex; gap:1rem; flex-wrap:wrap">
        <div style="flex:1; min-width:200px">
          <div style="background:#e0e0e0; height:120px; border-radius:4px; display:flex; align-items:center; justify-content:center; color:#666; margin-bottom:0.5rem">
            [Product Image]
          </div>
          <h4 style="margin:0 0 0.25rem">{{ product.name }}</h4>
          <p style="margin:0 0 0.25rem; font-size:1.25rem; font-weight:bold; color:#2e7d32">
            ${{ product.price }}
          </p>
          <p style="margin:0; font-size:0.9rem; color:#555">{{ product.description }}</p>
        </div>

        <div style="flex:1; min-width:200px; background:white; padding:0.75rem; border-radius:4px; font-size:0.85rem">
          <strong>SEO Tags Applied:</strong>
          <div style="margin-top:0.4rem; color:#2e7d32">Title: {{ seo.currentTitle()() }}</div>
          @for (tag of seo.currentTags()(); track tag.selector) {
            <div style="margin-top:0.2rem; font-size:0.8rem; color:#555">
              <code>{{ tag.selector }}</code>: {{ tag.content | slice:0:50 }}...
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class ProductPageComponent implements OnInit {
  seo     = inject(SeoService);
  product = DEMO_PRODUCT;

  ngOnInit() {
    this.seo.updateTitle(`${this.product.name} | MyShop`);
    this.seo.updateDescription(this.product.description);
    this.seo.updateOgTags({
      title:       this.product.name,
      description: this.product.description,
      image:       this.product.image,
      url:         `https://myshop.com/products/${this.product.id}`,
      type:        'product',
    });
    this.seo.updateTwitterCard({
      card:        'summary_large_image',
      title:       this.product.name,
      description: this.product.description,
      image:       this.product.image,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. MetaTagsDebugComponent
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-meta-debug',
  standalone: true,
  template: `
    <div style="padding:1.5rem; background:#fff3e0; border-radius:8px; margin-bottom:1rem">
      <h3>Meta Tags Debug Panel</h3>
      <p style="font-size:0.9rem; color:#555">
        In a real app, this reads from <code>inject(Meta).getTags('name')</code>
        and <code>inject(Title).getTitle()</code>.
      </p>

      <div style="background:white; padding:0.75rem; border-radius:4px; font-size:0.85rem">
        <div style="margin-bottom:0.5rem">
          <strong>document.title:</strong> <code>{{ currentTitle() }}</code>
        </div>
        <strong>Meta tags:</strong>
        @for (tag of currentTags(); track tag.selector) {
          <div style="margin-top:0.25rem; padding:0.25rem 0; border-bottom:1px solid #f0f0f0">
            <code style="color:#1565c0">{{ tag.selector }}</code>
            <span style="margin-left:0.5rem; color:#555">{{ tag.content }}</span>
          </div>
        }
      </div>

      <pre style="margin-top:0.75rem; background:#1e1e1e; color:#d4d4d4; padding:0.75rem; border-radius:4px; font-size:0.8rem">{{ debugCode }}</pre>
    </div>
  `,
})
export class MetaTagsDebugComponent {
  private seo = inject(SeoService);
  currentTitle = this.seo.currentTitle();
  currentTags  = this.seo.currentTags();

  debugCode = `
// Real Angular pattern:
const meta  = inject(Meta);
const title = inject(Title);

// Read all tags with a given attribute:
const allNames  = meta.getTags('name');
const allOg     = meta.getTags('property');
const descTag   = meta.getTag("name='description'");

// Get document title:
const pageTitle = title.getTitle();

// Remove a tag:
meta.removeTag("name='description'");`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. StructuredDataService
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class StructuredDataService {
  private _doc = inject(DOCUMENT);
  private SCRIPT_ID = 'structured-data';

  setStructuredData(data: Record<string, unknown>): void {
    let script = this._doc.getElementById(this.SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = this._doc.createElement('script');
      script.id   = this.SCRIPT_ID;
      script.type = 'application/ld+json';
      this._doc.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data, null, 2);
  }

  removeStructuredData(): void {
    const script = this._doc.getElementById(this.SCRIPT_ID);
    script?.remove();
  }

  getStructuredDataPreview(): string {
    // For demo: return the JSON we'd inject
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type':    'Product',
      name:       DEMO_PRODUCT.name,
      description: DEMO_PRODUCT.description,
      offers: {
        '@type': 'Offer',
        price:    DEMO_PRODUCT.price,
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    }, null, 2);
  }
}

@Component({
  selector: 'app-structured-data-demo',
  standalone: true,
  template: `
    <div style="padding:1.5rem; background:#f3e5f5; border-radius:8px; margin-bottom:1rem">
      <h3>Structured Data (JSON-LD)</h3>
      <p style="font-size:0.9rem; color:#555">
        Injected as <code>&lt;script type="application/ld+json"&gt;</code> in document head.
        Helps Google show rich results (product price, reviews, etc.).
      </p>
      <div style="display:flex; gap:0.5rem; margin-bottom:0.75rem">
        <button (click)="inject()" style="padding:0.4rem 0.75rem; background:#7b1fa2; color:white; border:none; border-radius:4px; cursor:pointer">
          Inject JSON-LD
        </button>
        <button (click)="remove()" style="padding:0.4rem 0.75rem; background:#555; color:white; border:none; border-radius:4px; cursor:pointer">
          Remove
        </button>
      </div>
      <pre style="background:#1e1e1e; color:#d4d4d4; padding:0.75rem; border-radius:4px; font-size:0.8rem; max-height:300px; overflow:auto">{{ preview }}</pre>
    </div>
  `,
})
export class StructuredDataDemoComponent {
  private sds = inject(StructuredDataService);
  preview = this.sds.getStructuredDataPreview();

  inject() {
    this.sds.setStructuredData({
      '@context': 'https://schema.org',
      '@type':    'Product',
      name:       DEMO_PRODUCT.name,
      price:      DEMO_PRODUCT.price,
    });
  }

  remove() { this.sds.removeStructuredData(); }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. CanonicalLinkService
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class CanonicalLinkService {
  private _doc = inject(DOCUMENT);

  setCanonicalUrl(url: string): void {
    let link = this._doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this._doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this._doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  removeCanonical(): void {
    const link = this._doc.head.querySelector('link[rel="canonical"]');
    link?.remove();
  }

  getCurrentCanonical(): string {
    return this._doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? '(none)';
  }
}

@Component({
  selector: 'app-canonical-demo',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div style="padding:1.5rem; background:#e0f7fa; border-radius:8px; margin-bottom:1rem">
      <h3>Canonical Link Service</h3>
      <p style="font-size:0.9rem; color:#555">
        Prevents duplicate content penalties by specifying the preferred URL.
      </p>

      <div style="display:flex; gap:0.5rem; margin-bottom:0.75rem; flex-wrap:wrap">
        <input [(ngModel)]="canonicalUrl"
               style="flex:1; min-width:200px; padding:0.4rem; border:1px solid #80deea; border-radius:4px" />
        <button (click)="set()" style="padding:0.4rem 0.75rem; background:#00838f; color:white; border:none; border-radius:4px; cursor:pointer">
          Set Canonical
        </button>
        <button (click)="remove()" style="padding:0.4rem 0.75rem; background:#555; color:white; border:none; border-radius:4px; cursor:pointer">
          Remove
        </button>
      </div>

      <div style="background:white; padding:0.5rem 0.75rem; border-radius:4px; font-size:0.9rem">
        Current canonical: <code>{{ current() }}</code>
      </div>

      <div style="margin-top:0.75rem; font-size:0.85rem; background:#e0f2f1; padding:0.75rem; border-radius:4px">
        <strong>Auto-canonical in AppComponent:</strong>
        <pre style="margin:0.4rem 0 0; font-size:0.8rem">{{ autoCode }}</pre>
      </div>
    </div>
  `,
})
export class CanonicalDemoComponent implements OnInit {
  private canonical = inject(CanonicalLinkService);
  canonicalUrl = 'https://myshop.com/products/angular-course';
  current = signal('(none)');

  ngOnInit() { this.set(); }

  set() {
    this.canonical.setCanonicalUrl(this.canonicalUrl);
    this.current.set(this.canonical.getCurrentCanonical());
  }

  remove() {
    this.canonical.removeCanonical();
    this.current.set('(none)');
  }

  autoCode = `
// app.component.ts — set canonical on every navigation:
constructor() {
  this.router.events
    .pipe(filter(e => e instanceof NavigationEnd))
    .subscribe(() => {
      const url = window.location.origin + this.router.url.split('?')[0];
      this.canonicalService.setCanonicalUrl(url);
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
    ProductPageComponent,
    MetaTagsDebugComponent,
    StructuredDataDemoComponent,
    CanonicalDemoComponent,
  ],
  template: `
    <div style="font-family:sans-serif; max-width:900px; margin:2rem auto; padding:0 1rem">
      <h1>Phase 7 – Meta & SEO</h1>
      <app-product-page />
      <app-meta-debug />
      <app-structured-data-demo />
      <app-canonical-demo />
    </div>
  `,
})
export class AppComponent {}
