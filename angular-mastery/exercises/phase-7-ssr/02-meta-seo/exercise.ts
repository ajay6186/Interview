// Phase 7 - Exercise 02: Meta & SEO
// Topics: Meta service, Title service, Open Graph tags, canonical links, structured data

import { Component } from '@angular/core';

// ─────────────────────────────────────────────
// TODO 1: SeoService — complete meta management
//
// Import Meta, Title from '@angular/platform-browser'
//
// @Injectable({ providedIn: 'root' })
// export class SeoService {
//   updateTitle(title: string): void
//     → this.titleService.setTitle(title)
//
//   updateDescription(desc: string): void
//     → this.meta.updateTag({ name: 'description', content: desc })
//
//   updateOgTags(data: OgData): void
//     → this.meta.updateTag({ property: 'og:title', content: data.title })
//     → this.meta.updateTag({ property: 'og:description', content: data.description })
//     → this.meta.updateTag({ property: 'og:image', content: data.image })
//     → this.meta.updateTag({ property: 'og:url', content: data.url })
//     → this.meta.updateTag({ property: 'og:type', content: 'website' })
//
//   updateTwitterCard(data: TwitterCardData): void
//     → this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' })
//     → this.meta.updateTag({ name: 'twitter:title', content: data.title })
//     → etc.
//
//   removeTag(selector: string): void
//     → this.meta.removeTag(selector)  e.g. "name='description'"
//
//   getTags(selector: string): HTMLMetaElement[]
//     → return this.meta.getTags(selector)
// }
// ─────────────────────────────────────────────

// TODO 1: SeoService
// @Injectable({ providedIn: 'root' })
// export class SeoService { }

// ─────────────────────────────────────────────
// TODO 2: ProductPageComponent — calls SeoService on route change
//
// Create ProductPageComponent:
// - Inject SeoService and ActivatedRoute
// - In ngOnInit, subscribe to route.data to get product data
// - Call seo.updateTitle(), seo.updateDescription(), seo.updateOgTags() with product data
// - Display the product: image, name, price, description
// - Show current <title> and meta tags in a debug panel
// ─────────────────────────────────────────────

// TODO 2: ProductPageComponent
// @Component({ ... })
// export class ProductPageComponent { }

// ─────────────────────────────────────────────
// TODO 3: MetaTagsComponent — displays current meta tags for debugging
//
// Create MetaTagsDebugComponent:
// - Inject Meta, Title from '@angular/platform-browser'
// - Read and display all current meta tags using this.meta.getTags('name')
// - Also show document.title
// - This is useful during development to verify SEO tags are set correctly
// ─────────────────────────────────────────────

// TODO 3: MetaTagsDebugComponent
// @Component({ ... })
// export class MetaTagsDebugComponent { }

// ─────────────────────────────────────────────
// TODO 4: StructuredDataService — JSON-LD injection
//
// JSON-LD (Linked Data) helps search engines understand page content.
// Google supports schemas like Product, Article, BreadcrumbList, etc.
//
// Create StructuredDataService:
//   - Inject DOCUMENT
//   - setStructuredData(data: object): void
//     → create or find <script id="structured-data" type="application/ld+json">
//     → set innerHTML = JSON.stringify(data)
//
//   - removeStructuredData(): void
//     → remove the script tag
//
// Usage (from a component):
//   sds.setStructuredData({
//     '@context': 'https://schema.org',
//     '@type':    'Product',
//     name:       'Angular Course',
//     price:      49.99,
//     ...
//   });
// ─────────────────────────────────────────────

// TODO 4: StructuredDataService
// @Injectable({ providedIn: 'root' })
// export class StructuredDataService { }

// ─────────────────────────────────────────────
// TODO 5: CanonicalLinkService — manages <link rel="canonical">
//
// Create CanonicalLinkService:
//   - Inject DOCUMENT
//   - setCanonicalUrl(url: string): void
//     → find or create <link rel="canonical"> in document.head
//     → set href attribute
//   - removeCanonical(): void
//     → remove the link element
//
// Also show how to automatically set canonical based on current route:
//   - Inject Router, listen to NavigationEnd
//   - Set canonical to window.location.origin + router.url
//   - Call this from AppComponent constructor
// ─────────────────────────────────────────────

// TODO 5: CanonicalLinkService
// @Injectable({ providedIn: 'root' })
// export class CanonicalLinkService { }

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
    <h1>Meta & SEO Exercise</h1>
    <!-- TODO 6: render components here -->
  `,
})
export class AppComponent {}
