import { Component, inject, signal, computed, OnInit, PLATFORM_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

// ============================================================
// Examples 7.2 — Meta Tags & SEO (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. inject(Meta) — access Meta service
@Component({
  selector: 'ex-01', standalone: true,
  template: `<p>Meta service injected: <code>inject(Meta)</code> — available as <code>this.meta</code>. Used to add/update/remove meta tags at runtime.</p>`
})
class Ex01 {
  meta = inject(Meta);
}

// 2. Meta.addTag({ name:'description', content:'...' })
@Component({
  selector: 'ex-02', standalone: true,
  template: `<p>Added tag: <code>{{ tagAdded() }}</code></p>`
})
class Ex02 implements OnInit {
  meta = inject(Meta);
  tagAdded = signal('');
  ngOnInit() {
    this.meta.addTag({ name: 'description', content: 'Angular SEO demo page' });
    this.tagAdded.set('name="description" content="Angular SEO demo page"');
  }
}

// 3. Meta.addTags([...]) — multiple at once
@Component({
  selector: 'ex-03', standalone: true,
  template: `<p>addTags added {{ count() }} tags at once.</p>`
})
class Ex03 implements OnInit {
  meta = inject(Meta);
  count = signal(0);
  ngOnInit() {
    this.meta.addTags([
      { name: 'keywords', content: 'Angular, SEO, Meta' },
      { name: 'author', content: 'Dev Team' },
      { name: 'robots', content: 'index, follow' },
    ]);
    this.count.set(3);
  }
}

// 4. Meta.getTag('name=description')
@Component({
  selector: 'ex-04', standalone: true,
  template: `<p>getTag result: <code>{{ result() }}</code></p>`
})
class Ex04 implements OnInit {
  meta = inject(Meta);
  result = signal('');
  ngOnInit() {
    this.meta.addTag({ name: 'description', content: 'Hello SEO' });
    const tag = this.meta.getTag('name=description');
    this.result.set(tag ? tag.content : 'not found');
  }
}

// 5. Meta.updateTag({ name:'description', content:'new' })
@Component({
  selector: 'ex-05', standalone: true,
  template: `<p>Updated description to: <code>{{ updated() }}</code></p>`
})
class Ex05 implements OnInit {
  meta = inject(Meta);
  updated = signal('');
  ngOnInit() {
    this.meta.addTag({ name: 'description', content: 'Old content' });
    this.meta.updateTag({ name: 'description', content: 'Updated content!' });
    const tag = this.meta.getTag('name=description');
    this.updated.set(tag?.content ?? '');
  }
}

// 6. Meta.removeTag('name=description')
@Component({
  selector: 'ex-06', standalone: true,
  template: `<p>After removeTag: tag is <code>{{ found() }}</code></p>`
})
class Ex06 implements OnInit {
  meta = inject(Meta);
  found = signal('');
  ngOnInit() {
    this.meta.addTag({ name: 'description', content: 'To be removed' });
    this.meta.removeTag('name=description');
    const tag = this.meta.getTag('name=description');
    this.found.set(tag ? 'still present' : 'removed successfully');
  }
}

// 7. inject(Title) — access Title service
@Component({
  selector: 'ex-07', standalone: true,
  template: `<p>Title service injected: <code>inject(Title)</code> — use <code>setTitle()</code> / <code>getTitle()</code>.</p>`
})
class Ex07 {
  title = inject(Title);
}

// 8. Title.setTitle('Page Title')
@Component({
  selector: 'ex-08', standalone: true,
  template: `<p>Document title set to: <em>{{ titleSet() }}</em></p>`
})
class Ex08 implements OnInit {
  titleSvc = inject(Title);
  titleSet = signal('');
  ngOnInit() {
    this.titleSvc.setTitle('Angular SEO — Examples');
    this.titleSet.set(this.titleSvc.getTitle());
  }
}

// 9. Title.getTitle()
@Component({
  selector: 'ex-09', standalone: true,
  template: `<p>Current document title: <em>{{ currentTitle() }}</em></p>`
})
class Ex09 implements OnInit {
  titleSvc = inject(Title);
  currentTitle = signal('');
  ngOnInit() {
    this.currentTitle.set(this.titleSvc.getTitle());
  }
}

// 10. Meta robots tag (noindex, nofollow)
@Component({
  selector: 'ex-10', standalone: true,
  template: `<p>Robots tag: <code>{{ robots() }}</code> — prevents indexing of private/admin pages.</p>`
})
class Ex10 implements OnInit {
  meta = inject(Meta);
  robots = signal('');
  ngOnInit() {
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    this.robots.set(this.meta.getTag('name=robots')?.content ?? '');
  }
}

// 11. Meta charset tag
@Component({
  selector: 'ex-11', standalone: true,
  template: `<p>Charset tag: <code>{{ charset() }}</code> — typically set in index.html but can be managed via Meta service.</p>`
})
class Ex11 implements OnInit {
  meta = inject(Meta);
  charset = signal('');
  ngOnInit() {
    this.meta.addTag({ charset: 'UTF-8' });
    this.charset.set('charset="UTF-8" — ensures correct text encoding');
  }
}

// 12. Meta viewport tag
@Component({
  selector: 'ex-12', standalone: true,
  template: `<p>Viewport tag: <code>{{ viewport() }}</code> — essential for mobile-responsive pages.</p>`
})
class Ex12 implements OnInit {
  meta = inject(Meta);
  viewport = signal('');
  ngOnInit() {
    this.meta.updateTag({ name: 'viewport', content: 'width=device-width, initial-scale=1' });
    this.viewport.set(this.meta.getTag('name=viewport')?.content ?? '');
  }
}

// 13. Meta author tag
@Component({
  selector: 'ex-13', standalone: true,
  template: `<p>Author meta: <code>{{ author() }}</code></p>`
})
class Ex13 implements OnInit {
  meta = inject(Meta);
  author = signal('');
  ngOnInit() {
    this.meta.addTag({ name: 'author', content: 'Angular Dev Team' });
    this.author.set(this.meta.getTag('name=author')?.content ?? '');
  }
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────

// 14. Open Graph: og:title
@Component({
  selector: 'ex-14', standalone: true,
  template: `<p>OG title tag: <code>property="og:title" content="{{ ogTitle() }}"</code></p>`
})
class Ex14 implements OnInit {
  meta = inject(Meta);
  ogTitle = signal('');
  ngOnInit() {
    this.meta.updateTag({ property: 'og:title', content: 'My Angular App' });
    this.ogTitle.set(this.meta.getTag('property=og:title')?.content ?? '');
  }
}

// 15. Open Graph: og:description
@Component({
  selector: 'ex-15', standalone: true,
  template: `<p>OG description: <code>{{ ogDesc() }}</code></p>`
})
class Ex15 implements OnInit {
  meta = inject(Meta);
  ogDesc = signal('');
  ngOnInit() {
    this.meta.updateTag({ property: 'og:description', content: 'A comprehensive Angular demo app' });
    this.ogDesc.set(this.meta.getTag('property=og:description')?.content ?? '');
  }
}

// 16. Open Graph: og:image
@Component({
  selector: 'ex-16', standalone: true,
  template: `<p>OG image tag set to: <code>{{ ogImage() }}</code> — shown as thumbnail when shared on social media.</p>`
})
class Ex16 implements OnInit {
  meta = inject(Meta);
  ogImage = signal('');
  ngOnInit() {
    this.meta.updateTag({ property: 'og:image', content: 'https://example.com/og-image.png' });
    this.ogImage.set(this.meta.getTag('property=og:image')?.content ?? '');
  }
}

// 17. Open Graph: og:url
@Component({
  selector: 'ex-17', standalone: true,
  template: `<p>OG url: <code>{{ ogUrl() }}</code></p>`
})
class Ex17 implements OnInit {
  meta = inject(Meta);
  ogUrl = signal('');
  ngOnInit() {
    this.meta.updateTag({ property: 'og:url', content: 'https://example.com/page' });
    this.ogUrl.set(this.meta.getTag('property=og:url')?.content ?? '');
  }
}

// 18. Open Graph: og:type (website/article)
@Component({
  selector: 'ex-18', standalone: true,
  template: `<p>OG type: <code>{{ ogType() }}</code> — use "article" for blog posts, "website" for home page.</p>`
})
class Ex18 implements OnInit {
  meta = inject(Meta);
  ogType = signal('');
  ngOnInit() {
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.ogType.set(this.meta.getTag('property=og:type')?.content ?? '');
  }
}

// 19. Twitter Card tags (twitter:card, twitter:title)
@Component({
  selector: 'ex-19', standalone: true,
  template: `<p>Twitter card: <code>{{ twitterCard() }}</code>, title: <code>{{ twitterTitle() }}</code></p>`
})
class Ex19 implements OnInit {
  meta = inject(Meta);
  twitterCard = signal('');
  twitterTitle = signal('');
  ngOnInit() {
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: 'My Angular App' });
    this.twitterCard.set(this.meta.getTag('name=twitter:card')?.content ?? '');
    this.twitterTitle.set(this.meta.getTag('name=twitter:title')?.content ?? '');
  }
}

// 20. Canonical link (inject DOCUMENT, create link element)
@Component({
  selector: 'ex-20', standalone: true,
  template: `<p>Canonical link set: <code>{{ canonical() }}</code> — prevents duplicate content SEO penalty.</p>`
})
class Ex20 implements OnInit {
  doc = inject(DOCUMENT);
  platformId = inject(PLATFORM_ID);
  canonical = signal('');
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      let link: HTMLLinkElement = this.doc.querySelector("link[rel='canonical']") as HTMLLinkElement;
      if (!link) {
        link = this.doc.createElement('link');
        link.setAttribute('rel', 'canonical');
        this.doc.head.appendChild(link);
      }
      link.setAttribute('href', 'https://example.com/canonical-page');
      this.canonical.set('https://example.com/canonical-page');
    } else {
      this.canonical.set('(SSR: set via server response headers)');
    }
  }
}

// 21. JSON-LD structured data (inject DOCUMENT, script tag)
@Component({
  selector: 'ex-21', standalone: true,
  template: `<p>JSON-LD script tag injected for structured data. Schema: <code>{{ schema() }}</code></p>`
})
class Ex21 implements OnInit {
  doc = inject(DOCUMENT);
  platformId = inject(PLATFORM_ID);
  schema = signal('');
  ngOnInit() {
    const data = { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Angular App' };
    if (isPlatformBrowser(this.platformId)) {
      const script = this.doc.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(data);
      this.doc.head.appendChild(script);
    }
    this.schema.set(JSON.stringify(data));
  }
}

// 22. Dynamic title per page (signal-driven)
@Component({
  selector: 'ex-22', standalone: true,
  template: `
    <p>Current title: <em>{{ pageName() }}</em></p>
    <button (click)="changePage('Home')">Home</button>
    <button (click)="changePage('About')">About</button>
    <button (click)="changePage('Contact')">Contact</button>
  `
})
class Ex22 {
  titleSvc = inject(Title);
  pageName = signal('Home');
  changePage(name: string) {
    this.pageName.set(name);
    this.titleSvc.setTitle(`${name} — My Angular App`);
  }
}

// 23. Dynamic description per page
@Component({
  selector: 'ex-23', standalone: true,
  template: `
    <p>Description: <em>{{ desc() }}</em></p>
    <button (click)="setDesc('product')">Product</button>
    <button (click)="setDesc('blog')">Blog</button>
  `
})
class Ex23 {
  meta = inject(Meta);
  desc = signal('Default description');
  descriptions: Record<string, string> = {
    product: 'Browse our latest products with great deals.',
    blog: 'Read insightful articles about Angular development.',
  };
  setDesc(page: string) {
    const content = this.descriptions[page] ?? 'Default description';
    this.meta.updateTag({ name: 'description', content });
    this.desc.set(content);
  }
}

// 24. Social share preview demo (shows all meta)
@Component({
  selector: 'ex-24', standalone: true,
  template: `
    <div style="border:1px solid #ccc;padding:10px;border-radius:4px;max-width:400px">
      <strong>Social Preview</strong>
      <div style="background:#1877f2;color:#fff;padding:4px 8px;border-radius:3px 3px 0 0">{{ ogTitle() }}</div>
      <div style="padding:8px;font-size:13px;color:#666">{{ ogDesc() }}</div>
      <div style="padding:4px 8px;font-size:11px;color:#999">{{ ogUrl() }}</div>
    </div>
  `
})
class Ex24 implements OnInit {
  meta = inject(Meta);
  ogTitle = signal('');
  ogDesc = signal('');
  ogUrl = signal('');
  ngOnInit() {
    this.meta.updateTag({ property: 'og:title', content: 'Angular SEO Demo' });
    this.meta.updateTag({ property: 'og:description', content: 'Complete SEO meta tag examples for Angular apps.' });
    this.meta.updateTag({ property: 'og:url', content: 'https://example.com/seo-demo' });
    this.ogTitle.set(this.meta.getTag('property=og:title')?.content ?? '');
    this.ogDesc.set(this.meta.getTag('property=og:description')?.content ?? '');
    this.ogUrl.set(this.meta.getTag('property=og:url')?.content ?? '');
  }
}

// 25. Meta for PWA (theme-color, apple-mobile)
@Component({
  selector: 'ex-25', standalone: true,
  template: `<p>PWA meta tags: theme-color <code>{{ themeColor() }}</code>, apple-status-bar <code>{{ appleBar() }}</code></p>`
})
class Ex25 implements OnInit {
  meta = inject(Meta);
  themeColor = signal('');
  appleBar = signal('');
  ngOnInit() {
    this.meta.updateTag({ name: 'theme-color', content: '#3f51b5' });
    this.meta.updateTag({ name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' });
    this.themeColor.set(this.meta.getTag('name=theme-color')?.content ?? '');
    this.appleBar.set(this.meta.getTag('name=apple-mobile-web-app-status-bar-style')?.content ?? '');
  }
}

// 26. Hreflang tag for international SEO
@Component({
  selector: 'ex-26', standalone: true,
  template: `<p>Hreflang links added for: <code>{{ langs() }}</code> — tells Google which page serves which language.</p>`
})
class Ex26 implements OnInit {
  doc = inject(DOCUMENT);
  platformId = inject(PLATFORM_ID);
  langs = signal('');
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const hreflangs = [
        { lang: 'en', href: 'https://example.com/en/' },
        { lang: 'fr', href: 'https://example.com/fr/' },
        { lang: 'de', href: 'https://example.com/de/' },
      ];
      hreflangs.forEach(({ lang, href }) => {
        const link = this.doc.createElement('link');
        link.rel = 'alternate';
        link.hreflang = lang;
        link.href = href;
        this.doc.head.appendChild(link);
      });
      this.langs.set(hreflangs.map(h => h.lang).join(', '));
    } else {
      this.langs.set('en, fr, de (SSR render)');
    }
  }
}

// ─── NESTED (27–38) ──────────────────────────────────────────

// 27. SEO service with signal-based meta management
class SeoSignalService {
  private meta = inject(Meta);
  private titleSvc = inject(Title);
  readonly currentTitle = signal('');
  readonly currentDesc = signal('');

  setPage(title: string, description: string) {
    this.titleSvc.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.currentTitle.set(title);
    this.currentDesc.set(description);
  }
}

@Component({
  selector: 'ex-27', standalone: true,
  providers: [SeoSignalService],
  template: `
    <p>SEO Service — Title: <em>{{ seo.currentTitle() }}</em></p>
    <p>Description: <em>{{ seo.currentDesc() }}</em></p>
    <button (click)="seo.setPage('Home Page', 'Welcome to our site')">Home</button>
    <button (click)="seo.setPage('Products', 'Browse all products')">Products</button>
  `
})
class Ex27 {
  seo = inject(SeoSignalService);
}

// 28. Product page SEO (title + desc + og + schema)
@Component({
  selector: 'ex-28', standalone: true,
  template: `
    <div style="border:1px solid #e0e0e0;padding:12px;border-radius:4px">
      <strong>Product SEO applied:</strong>
      <ul>
        <li>Title: {{ product().name }}</li>
        <li>Description: {{ product().desc }}</li>
        <li>OG image set</li>
        <li>Product schema (JSON-LD)</li>
      </ul>
    </div>
  `
})
class Ex28 implements OnInit {
  meta = inject(Meta);
  titleSvc = inject(Title);
  product = signal({ name: 'Angular Book', desc: 'Master Angular from basics to advanced', price: '49.99' });
  ngOnInit() {
    const p = this.product();
    this.titleSvc.setTitle(`${p.name} — Buy Now`);
    this.meta.updateTag({ name: 'description', content: p.desc });
    this.meta.updateTag({ property: 'og:title', content: p.name });
    this.meta.updateTag({ property: 'og:image', content: 'https://example.com/product.jpg' });
    this.meta.updateTag({ property: 'og:type', content: 'product' });
  }
}

// 29. Blog post SEO (article schema, author, date)
@Component({
  selector: 'ex-29', standalone: true,
  template: `
    <div style="border:1px solid #e0e0e0;padding:12px;border-radius:4px">
      <strong>Blog SEO:</strong> {{ post().title }}<br/>
      <small>Author: {{ post().author }} | {{ post().date }}</small><br/>
      <small>og:type set to "article", article:author + article:published_time added</small>
    </div>
  `
})
class Ex29 implements OnInit {
  meta = inject(Meta);
  titleSvc = inject(Title);
  post = signal({ title: 'Top 10 Angular Tips', author: 'Jane Dev', date: '2026-03-20' });
  ngOnInit() {
    const p = this.post();
    this.titleSvc.setTitle(p.title);
    this.meta.updateTag({ property: 'og:type', content: 'article' });
    this.meta.updateTag({ property: 'article:author', content: p.author });
    this.meta.updateTag({ property: 'article:published_time', content: p.date });
  }
}

// 30. Category page SEO (breadcrumb schema)
@Component({
  selector: 'ex-30', standalone: true,
  template: `
    <p>Category: <strong>{{ category() }}</strong></p>
    <p>Breadcrumb JSON-LD: <code>Home › {{ category() }}</code></p>
  `
})
class Ex30 implements OnInit {
  meta = inject(Meta);
  titleSvc = inject(Title);
  doc = inject(DOCUMENT);
  platformId = inject(PLATFORM_ID);
  category = signal('Frameworks');
  ngOnInit() {
    const cat = this.category();
    this.titleSvc.setTitle(`${cat} — Browse Articles`);
    this.meta.updateTag({ name: 'description', content: `Browse all articles in ${cat}` });
    if (isPlatformBrowser(this.platformId)) {
      const schema = {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://example.com' },
          { '@type': 'ListItem', position: 2, name: cat, item: `https://example.com/${cat.toLowerCase()}` },
        ]
      };
      const s = this.doc.createElement('script');
      s.type = 'application/ld+json';
      s.text = JSON.stringify(schema);
      this.doc.head.appendChild(s);
    }
  }
}

// 31. Homepage SEO (organization schema)
@Component({
  selector: 'ex-31', standalone: true,
  template: `<p>Homepage SEO: Organization schema injected. Name: <strong>{{ orgName() }}</strong></p>`
})
class Ex31 implements OnInit {
  meta = inject(Meta);
  titleSvc = inject(Title);
  doc = inject(DOCUMENT);
  platformId = inject(PLATFORM_ID);
  orgName = signal('Acme Corp');
  ngOnInit() {
    this.titleSvc.setTitle('Acme Corp — Official Website');
    this.meta.updateTag({ name: 'description', content: 'Acme Corp delivers innovative solutions.' });
    if (isPlatformBrowser(this.platformId)) {
      const schema = {
        '@context': 'https://schema.org', '@type': 'Organization',
        name: 'Acme Corp', url: 'https://example.com', logo: 'https://example.com/logo.png',
      };
      const s = this.doc.createElement('script');
      s.type = 'application/ld+json';
      s.text = JSON.stringify(schema);
      this.doc.head.appendChild(s);
    }
  }
}

// 32. Search results page (noindex pattern)
@Component({
  selector: 'ex-32', standalone: true,
  template: `
    <p>Search results for: <strong>{{ query() }}</strong></p>
    <p>Robots set to: <code>{{ robots() }}</code> — search results pages should not be indexed.</p>
  `
})
class Ex32 implements OnInit {
  meta = inject(Meta);
  query = signal('angular components');
  robots = signal('');
  ngOnInit() {
    this.meta.updateTag({ name: 'robots', content: 'noindex, follow' });
    this.robots.set(this.meta.getTag('name=robots')?.content ?? '');
  }
}

// 33. Social sharing component (shows current meta)
@Component({
  selector: 'ex-33', standalone: true,
  template: `
    <div style="background:#f5f5f5;padding:10px;border-radius:4px">
      <strong>Current Social Meta:</strong>
      <div>og:title — {{ ogTitle() }}</div>
      <div>og:description — {{ ogDesc() }}</div>
      <div>twitter:card — {{ twitterCard() }}</div>
    </div>
  `
})
class Ex33 implements OnInit {
  meta = inject(Meta);
  ogTitle = signal('');
  ogDesc = signal('');
  twitterCard = signal('');
  ngOnInit() {
    this.meta.updateTag({ property: 'og:title', content: 'Share This Page!' });
    this.meta.updateTag({ property: 'og:description', content: 'Great content for sharing' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.ogTitle.set(this.meta.getTag('property=og:title')?.content ?? '');
    this.ogDesc.set(this.meta.getTag('property=og:description')?.content ?? '');
    this.twitterCard.set(this.meta.getTag('name=twitter:card')?.content ?? '');
  }
}

// 34. SEO with breadcrumbs (BreadcrumbList schema)
@Component({
  selector: 'ex-34', standalone: true,
  template: `
    <nav>
      @for (crumb of breadcrumbs(); track crumb.name; let last = $last) {
        <span>{{ crumb.name }}</span>@if (!last) { <span> › </span> }
      }
    </nav>
    <small>BreadcrumbList JSON-LD injected with {{ breadcrumbs().length }} items</small>
  `
})
class Ex34 implements OnInit {
  doc = inject(DOCUMENT);
  platformId = inject(PLATFORM_ID);
  breadcrumbs = signal([
    { name: 'Home', url: 'https://example.com' },
    { name: 'Blog', url: 'https://example.com/blog' },
    { name: 'Angular Tips', url: 'https://example.com/blog/angular-tips' },
  ]);
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const schema = {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: this.breadcrumbs().map((b, i) => ({
          '@type': 'ListItem', position: i + 1, name: b.name, item: b.url,
        }))
      };
      const s = this.doc.createElement('script');
      s.type = 'application/ld+json';
      s.text = JSON.stringify(schema);
      this.doc.head.appendChild(s);
    }
  }
}

// 35. Dynamic title strategy (TitleStrategy class) — shown as code
@Component({
  selector: 'ex-35', standalone: true,
  template: `
    <pre style="background:#f4f4f4;padding:10px;font-size:12px;overflow:auto">{{ code }}</pre>
  `
})
class Ex35 {
  code = `// Custom TitleStrategy example:
import { Injectable } from '@angular/core';
import { TitleStrategy, RouterStateSnapshot } from '@angular/router';
import { Title } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class PageTitleStrategy extends TitleStrategy {
  constructor(private title: Title) { super(); }
  override updateTitle(snapshot: RouterStateSnapshot) {
    const title = this.buildTitle(snapshot);
    this.title.setTitle(title ? \`\${title} — My App\` : 'My App');
  }
}
// In providers: { provide: TitleStrategy, useClass: PageTitleStrategy }`;
}

// 36. Route-based meta update pattern
@Component({
  selector: 'ex-36', standalone: true,
  template: `
    <p>Simulated route change to: <strong>{{ route() }}</strong></p>
    <p>Meta updated: title + description + og tags</p>
    <button (click)="navigate('home')">Home</button>
    <button (click)="navigate('about')">About</button>
    <button (click)="navigate('products')">Products</button>
  `
})
class Ex36 {
  meta = inject(Meta);
  titleSvc = inject(Title);
  route = signal('home');
  routeMeta: Record<string, { title: string; desc: string }> = {
    home: { title: 'Home', desc: 'Welcome to our homepage' },
    about: { title: 'About Us', desc: 'Learn about our team' },
    products: { title: 'Products', desc: 'Browse our catalog' },
  };
  navigate(r: string) {
    this.route.set(r);
    const m = this.routeMeta[r];
    if (m) {
      this.titleSvc.setTitle(m.title);
      this.meta.updateTag({ name: 'description', content: m.desc });
      this.meta.updateTag({ property: 'og:title', content: m.title });
    }
  }
}

// 37. SEO for dynamic content (SSR meta)
@Component({
  selector: 'ex-37', standalone: true,
  template: `
    <p>Platform: <strong>{{ platform() }}</strong></p>
    <p>In SSR, meta tags are set server-side so crawlers see them on first load.</p>
    <p>isPlatformBrowser check: <code>{{ isBrowser() }}</code></p>
  `
})
class Ex37 implements OnInit {
  platformId = inject(PLATFORM_ID);
  meta = inject(Meta);
  platform = signal('');
  isBrowser = signal(false);
  ngOnInit() {
    const browser = isPlatformBrowser(this.platformId);
    this.isBrowser.set(browser);
    this.platform.set(browser ? 'Browser' : 'Server');
    this.meta.updateTag({ name: 'description', content: 'Dynamic SSR-aware content description' });
  }
}

// 38. Full SEO service: title + meta + canonical + JSON-LD
class FullSeoService {
  private meta = inject(Meta);
  private titleSvc = inject(Title);
  private doc = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);

  setFullSeo(config: { title: string; desc: string; url: string; image?: string; schema?: object }) {
    this.titleSvc.setTitle(config.title);
    this.meta.updateTag({ name: 'description', content: config.desc });
    this.meta.updateTag({ property: 'og:title', content: config.title });
    this.meta.updateTag({ property: 'og:description', content: config.desc });
    this.meta.updateTag({ property: 'og:url', content: config.url });
    if (config.image) this.meta.updateTag({ property: 'og:image', content: config.image });
    if (isPlatformBrowser(this.platformId) && config.schema) {
      const s = this.doc.createElement('script');
      s.type = 'application/ld+json';
      s.text = JSON.stringify(config.schema);
      this.doc.head.appendChild(s);
    }
  }
}

@Component({
  selector: 'ex-38', standalone: true,
  providers: [FullSeoService],
  template: `
    <p>Full SEO service applied: <strong>{{ applied() }}</strong></p>
    <button (click)="applySeo()">Apply Full SEO</button>
  `
})
class Ex38 {
  seo = inject(FullSeoService);
  applied = signal('not applied');
  applySeo() {
    this.seo.setFullSeo({
      title: 'Full SEO Page',
      desc: 'A fully optimized page with all SEO signals',
      url: 'https://example.com/full-seo',
      image: 'https://example.com/og.png',
      schema: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Full SEO Page' }
    });
    this.applied.set('title + meta + OG + JSON-LD');
  }
}

// ─── ADVANCED (39–50) ────────────────────────────────────────

// 39. Custom TitleStrategy class implementation (live demo)
@Component({
  selector: 'ex-39', standalone: true,
  template: `
    <p>Custom TitleStrategy intercepts router title data and appends brand suffix.</p>
    <p>Result: route title <code>"{{ routeTitle() }}"</code> → browser title <code>"{{ routeTitle() }} — Brand"</code></p>
    <pre style="background:#f4f4f4;padding:8px;font-size:11px">{{ code }}</pre>
  `
})
class Ex39 {
  routeTitle = signal('Product Detail');
  code = `{ provide: TitleStrategy, useClass: PageTitleStrategy }`;
}

// 40. Route data meta (resolve + inject Meta)
@Component({
  selector: 'ex-40', standalone: true,
  template: `
    <p>Route data meta pattern: resolver fetches page meta from API, then injects into Meta service on navigation.</p>
    <pre style="background:#f4f4f4;padding:8px;font-size:11px">{{ code }}</pre>
  `
})
class Ex40 {
  code = `// In route config:
{
  path: 'product/:id',
  component: ProductPageComponent,
  resolve: { meta: productMetaResolver },
}
// Resolver:
export const productMetaResolver: ResolveFn<PageMeta> = (route) =>
  inject(ProductService).getMeta(route.paramMap.get('id')!);
// In component:
ngOnInit() {
  const meta = this.route.snapshot.data['meta'] as PageMeta;
  this.metaService.updateTag({ name: 'description', content: meta.description });
}`;
}

// 41. Dynamic JSON-LD for e-commerce product
@Component({
  selector: 'ex-41', standalone: true,
  template: `
    <p>Product: <strong>{{ product().name }}</strong> — ${{ product().price }}</p>
    <button (click)="injectSchema()">Inject Product JSON-LD</button>
    <p>{{ status() }}</p>
  `
})
class Ex41 {
  doc = inject(DOCUMENT);
  platformId = inject(PLATFORM_ID);
  product = signal({ name: 'Angular Course', price: '99.00', sku: 'ANG-001', availability: 'InStock' });
  status = signal('');
  injectSchema() {
    if (!isPlatformBrowser(this.platformId)) { this.status.set('SSR only'); return; }
    const p = this.product();
    const schema = {
      '@context': 'https://schema.org', '@type': 'Product',
      name: p.name, sku: p.sku,
      offers: { '@type': 'Offer', price: p.price, priceCurrency: 'USD', availability: `https://schema.org/${p.availability}` }
    };
    const s = this.doc.createElement('script');
    s.type = 'application/ld+json';
    s.text = JSON.stringify(schema);
    this.doc.head.appendChild(s);
    this.status.set('Product schema injected!');
  }
}

// 42. Core Web Vitals tracking concept
@Component({
  selector: 'ex-42', standalone: true,
  template: `
    <p>Core Web Vitals: LCP, FID, CLS measured via PerformanceObserver.</p>
    <pre style="background:#f4f4f4;padding:8px;font-size:11px">{{ code }}</pre>
  `
})
class Ex42 {
  code = `// Track LCP:
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('LCP:', entry.startTime);
    // send to analytics
  }
}).observe({ type: 'largest-contentful-paint', buffered: true });`;
}

// 43. Resource hints (preconnect/dns-prefetch via DOCUMENT)
@Component({
  selector: 'ex-43', standalone: true,
  template: `
    <p>Resource hints added: <code>{{ hints().join(', ') }}</code></p>
    <button (click)="addHints()">Add Resource Hints</button>
  `
})
class Ex43 {
  doc = inject(DOCUMENT);
  platformId = inject(PLATFORM_ID);
  hints = signal<string[]>([]);
  addHints() {
    if (!isPlatformBrowser(this.platformId)) return;
    const resources = [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'dns-prefetch', href: 'https://cdn.example.com' },
    ];
    resources.forEach(r => {
      const link = this.doc.createElement('link');
      link.rel = r.rel;
      link.href = r.href;
      this.doc.head.appendChild(link);
    });
    this.hints.set(resources.map(r => r.rel));
  }
}

// 44. Meta for PWA manifest link
@Component({
  selector: 'ex-44', standalone: true,
  template: `
    <p>PWA manifest link and meta tags added:</p>
    <ul>
      <li>manifest.webmanifest link</li>
      <li>apple-touch-icon</li>
      <li>mobile-web-app-capable</li>
    </ul>
    <button (click)="addPwaMeta()">Add PWA Meta</button>
    <p>{{ status() }}</p>
  `
})
class Ex44 {
  doc = inject(DOCUMENT);
  meta = inject(Meta);
  platformId = inject(PLATFORM_ID);
  status = signal('');
  addPwaMeta() {
    if (isPlatformBrowser(this.platformId)) {
      const manifest = this.doc.createElement('link');
      manifest.rel = 'manifest';
      manifest.href = '/manifest.webmanifest';
      this.doc.head.appendChild(manifest);
    }
    this.meta.updateTag({ name: 'mobile-web-app-capable', content: 'yes' });
    this.meta.updateTag({ name: 'apple-mobile-web-app-capable', content: 'yes' });
    this.status.set('PWA meta tags applied');
  }
}

// 45. SEO with pagination (prev/next links)
@Component({
  selector: 'ex-45', standalone: true,
  template: `
    <p>Page {{ currentPage() }} of {{ totalPages() }}</p>
    <button (click)="prev()" [disabled]="currentPage() === 1">Prev</button>
    <button (click)="next()" [disabled]="currentPage() === totalPages()">Next</button>
    <p>rel=prev: <code>{{ prevUrl() }}</code> | rel=next: <code>{{ nextUrl() }}</code></p>
  `
})
class Ex45 {
  doc = inject(DOCUMENT);
  platformId = inject(PLATFORM_ID);
  currentPage = signal(2);
  totalPages = signal(5);
  prevUrl = computed(() => `https://example.com/blog?page=${this.currentPage() - 1}`);
  nextUrl = computed(() => `https://example.com/blog?page=${this.currentPage() + 1}`);

  private updatePaginationLinks() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.doc.querySelectorAll("link[rel='prev'], link[rel='next']").forEach(l => l.remove());
    const page = this.currentPage();
    const total = this.totalPages();
    if (page > 1) {
      const prev = this.doc.createElement('link');
      prev.rel = 'prev'; prev.href = this.prevUrl();
      this.doc.head.appendChild(prev);
    }
    if (page < total) {
      const next = this.doc.createElement('link');
      next.rel = 'next'; next.href = this.nextUrl();
      this.doc.head.appendChild(next);
    }
  }

  prev() { if (this.currentPage() > 1) { this.currentPage.update(p => p - 1); this.updatePaginationLinks(); } }
  next() { if (this.currentPage() < this.totalPages()) { this.currentPage.update(p => p + 1); this.updatePaginationLinks(); } }
}

// 46. SEO canonical URL with query params handling
@Component({
  selector: 'ex-46', standalone: true,
  template: `
    <p>URL: <code>{{ currentUrl() }}</code></p>
    <p>Canonical (no query): <code>{{ canonicalUrl() }}</code></p>
    <p>Query params stripped to prevent duplicate content for filtered/sorted pages.</p>
  `
})
class Ex46 implements OnInit {
  doc = inject(DOCUMENT);
  platformId = inject(PLATFORM_ID);
  currentUrl = signal('https://example.com/products?sort=price&page=2');
  canonicalUrl = computed(() => this.currentUrl().split('?')[0]);
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      let link: HTMLLinkElement = this.doc.querySelector("link[rel='canonical']") as HTMLLinkElement;
      if (!link) { link = this.doc.createElement('link'); link.rel = 'canonical'; this.doc.head.appendChild(link); }
      link.href = this.canonicalUrl();
    }
  }
}

// 47. International SEO (x-default hreflang)
@Component({
  selector: 'ex-47', standalone: true,
  template: `
    <p>Hreflang strategy with x-default for international SEO.</p>
    <ul>
      @for (entry of hreflangs(); track entry.lang) {
        <li><code>{{ entry.lang }}</code> → {{ entry.href }}</li>
      }
    </ul>
  `
})
class Ex47 implements OnInit {
  doc = inject(DOCUMENT);
  platformId = inject(PLATFORM_ID);
  hreflangs = signal([
    { lang: 'en', href: 'https://example.com/en/' },
    { lang: 'fr', href: 'https://example.com/fr/' },
    { lang: 'x-default', href: 'https://example.com/en/' },
  ]);
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.hreflangs().forEach(({ lang, href }) => {
        const link = this.doc.createElement('link');
        link.rel = 'alternate'; link.hreflang = lang; link.href = href;
        this.doc.head.appendChild(link);
      });
    }
  }
}

// 48. SEO A/B testing (different meta per variant)
@Component({
  selector: 'ex-48', standalone: true,
  template: `
    <p>A/B Variant: <strong>{{ variant() }}</strong></p>
    <p>Title: <em>{{ currentMeta().title }}</em></p>
    <p>Description: <em>{{ currentMeta().desc }}</em></p>
    <button (click)="toggleVariant()">Switch Variant</button>
  `
})
class Ex48 implements OnInit {
  meta = inject(Meta);
  titleSvc = inject(Title);
  variant = signal<'A' | 'B'>('A');
  variants = {
    A: { title: 'Learn Angular — Free Course', desc: 'Start learning Angular today for free.' },
    B: { title: 'Master Angular in 30 Days', desc: 'Fast-track your Angular career with our course.' },
  };
  currentMeta = computed(() => this.variants[this.variant()]);
  ngOnInit() { this.applyMeta(); }
  toggleVariant() {
    this.variant.update(v => v === 'A' ? 'B' : 'A');
    this.applyMeta();
  }
  applyMeta() {
    const m = this.currentMeta();
    this.titleSvc.setTitle(m.title);
    this.meta.updateTag({ name: 'description', content: m.desc });
  }
}

// 49. Meta tag audit component (shows all current tags)
@Component({
  selector: 'ex-49', standalone: true,
  template: `
    <button (click)="auditTags()">Audit Meta Tags</button>
    <div style="max-height:150px;overflow:auto;margin-top:8px">
      @for (tag of auditResults(); track $index) {
        <div style="font-size:12px;font-family:monospace">{{ tag }}</div>
      }
    </div>
  `
})
class Ex49 {
  doc = inject(DOCUMENT);
  platformId = inject(PLATFORM_ID);
  auditResults = signal<string[]>([]);
  auditTags() {
    if (!isPlatformBrowser(this.platformId)) { this.auditResults.set(['SSR: cannot audit DOM']); return; }
    const tags = Array.from(this.doc.head.querySelectorAll('meta'));
    const results = tags.map(t => {
      const attrs = Array.from(t.attributes).map(a => `${a.name}="${a.value}"`).join(' ');
      return `<meta ${attrs}>`;
    });
    this.auditResults.set(results.length > 0 ? results : ['No meta tags found']);
  }
}

// 50. Full SEO strategy: TitleStrategy + Meta service + JSON-LD
@Component({
  selector: 'ex-50', standalone: true,
  template: `
    <div style="border:2px solid #3f51b5;padding:12px;border-radius:4px">
      <strong>Full SEO Strategy Demo</strong>
      <p>Page: <strong>{{ page().title }}</strong></p>
      @for (item of seoChecklist(); track item.key) {
        <div>{{ item.done ? '✓' : '○' }} {{ item.label }}</div>
      }
      <button (click)="applyFullSeo()" style="margin-top:8px">Apply Full SEO</button>
    </div>
  `
})
class Ex50 implements OnInit {
  meta = inject(Meta);
  titleSvc = inject(Title);
  doc = inject(DOCUMENT);
  platformId = inject(PLATFORM_ID);
  page = signal({ title: 'Ultimate Angular Guide', desc: 'Everything about Angular.', url: 'https://example.com/guide' });
  seoChecklist = signal([
    { key: 'title', label: 'Document title set', done: false },
    { key: 'desc', label: 'Meta description', done: false },
    { key: 'og', label: 'Open Graph tags', done: false },
    { key: 'twitter', label: 'Twitter Card tags', done: false },
    { key: 'canonical', label: 'Canonical URL', done: false },
    { key: 'jsonld', label: 'JSON-LD schema', done: false },
  ]);
  ngOnInit() { this.applyFullSeo(); }
  applyFullSeo() {
    const p = this.page();
    this.titleSvc.setTitle(p.title);
    this.meta.updateTag({ name: 'description', content: p.desc });
    this.meta.updateTag({ property: 'og:title', content: p.title });
    this.meta.updateTag({ property: 'og:description', content: p.desc });
    this.meta.updateTag({ property: 'og:url', content: p.url });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: p.title });
    if (isPlatformBrowser(this.platformId)) {
      let link: HTMLLinkElement = this.doc.querySelector("link[rel='canonical']") as HTMLLinkElement;
      if (!link) { link = this.doc.createElement('link'); link.rel = 'canonical'; this.doc.head.appendChild(link); }
      link.href = p.url;
      const schema = { '@context': 'https://schema.org', '@type': 'WebPage', name: p.title, description: p.desc };
      const s = this.doc.createElement('script'); s.type = 'application/ld+json'; s.text = JSON.stringify(schema);
      this.doc.head.appendChild(s);
    }
    this.seoChecklist.update(list => list.map(item => ({ ...item, done: true })));
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
      <h1>Examples 7.2 — Meta Tags &amp; SEO</h1>
      <h4>1. inject(Meta) — access Meta service</h4><ex-01 /><hr />
      <h4>2. Meta.addTag({ name:'description', content:'...' })</h4><ex-02 /><hr />
      <h4>3. Meta.addTags([...]) — multiple at once</h4><ex-03 /><hr />
      <h4>4. Meta.getTag('name=description')</h4><ex-04 /><hr />
      <h4>5. Meta.updateTag({ name:'description', content:'new' })</h4><ex-05 /><hr />
      <h4>6. Meta.removeTag('name=description')</h4><ex-06 /><hr />
      <h4>7. inject(Title) — access Title service</h4><ex-07 /><hr />
      <h4>8. Title.setTitle('Page Title')</h4><ex-08 /><hr />
      <h4>9. Title.getTitle()</h4><ex-09 /><hr />
      <h4>10. Meta robots tag (noindex, nofollow)</h4><ex-10 /><hr />
      <h4>11. Meta charset tag</h4><ex-11 /><hr />
      <h4>12. Meta viewport tag</h4><ex-12 /><hr />
      <h4>13. Meta author tag</h4><ex-13 /><hr />
      <h4>14. Open Graph: og:title</h4><ex-14 /><hr />
      <h4>15. Open Graph: og:description</h4><ex-15 /><hr />
      <h4>16. Open Graph: og:image</h4><ex-16 /><hr />
      <h4>17. Open Graph: og:url</h4><ex-17 /><hr />
      <h4>18. Open Graph: og:type (website/article)</h4><ex-18 /><hr />
      <h4>19. Twitter Card tags</h4><ex-19 /><hr />
      <h4>20. Canonical link (inject DOCUMENT)</h4><ex-20 /><hr />
      <h4>21. JSON-LD structured data</h4><ex-21 /><hr />
      <h4>22. Dynamic title per page (signal-driven)</h4><ex-22 /><hr />
      <h4>23. Dynamic description per page</h4><ex-23 /><hr />
      <h4>24. Social share preview demo</h4><ex-24 /><hr />
      <h4>25. Meta for PWA (theme-color, apple-mobile)</h4><ex-25 /><hr />
      <h4>26. Hreflang tag for international SEO</h4><ex-26 /><hr />
      <h4>27. SEO service with signal-based meta management</h4><ex-27 /><hr />
      <h4>28. Product page SEO</h4><ex-28 /><hr />
      <h4>29. Blog post SEO (article schema)</h4><ex-29 /><hr />
      <h4>30. Category page SEO (breadcrumb schema)</h4><ex-30 /><hr />
      <h4>31. Homepage SEO (organization schema)</h4><ex-31 /><hr />
      <h4>32. Search results page (noindex pattern)</h4><ex-32 /><hr />
      <h4>33. Social sharing component</h4><ex-33 /><hr />
      <h4>34. SEO with breadcrumbs (BreadcrumbList schema)</h4><ex-34 /><hr />
      <h4>35. Dynamic title strategy (TitleStrategy class)</h4><ex-35 /><hr />
      <h4>36. Route-based meta update pattern</h4><ex-36 /><hr />
      <h4>37. SEO for dynamic content (SSR meta)</h4><ex-37 /><hr />
      <h4>38. Full SEO service: title + meta + canonical + JSON-LD</h4><ex-38 /><hr />
      <h4>39. Custom TitleStrategy class implementation</h4><ex-39 /><hr />
      <h4>40. Route data meta (resolve + inject Meta)</h4><ex-40 /><hr />
      <h4>41. Dynamic JSON-LD for e-commerce product</h4><ex-41 /><hr />
      <h4>42. Core Web Vitals tracking concept</h4><ex-42 /><hr />
      <h4>43. Resource hints (preconnect/dns-prefetch)</h4><ex-43 /><hr />
      <h4>44. Meta for PWA manifest link</h4><ex-44 /><hr />
      <h4>45. SEO with pagination (prev/next links)</h4><ex-45 /><hr />
      <h4>46. SEO canonical URL with query params handling</h4><ex-46 /><hr />
      <h4>47. International SEO (x-default hreflang)</h4><ex-47 /><hr />
      <h4>48. SEO A/B testing (different meta per variant)</h4><ex-48 /><hr />
      <h4>49. Meta tag audit component</h4><ex-49 /><hr />
      <h4>50. Full SEO strategy: TitleStrategy + Meta service + JSON-LD</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
