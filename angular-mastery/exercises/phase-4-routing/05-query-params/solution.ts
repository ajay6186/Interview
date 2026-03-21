// Phase 4 - Solution 05: Query Params
// Topics: queryParams, queryParamMap, fragment, NavigationExtras,
//         queryParamsHandling: 'merge' | 'preserve', router.navigate with queryParams

import { Component, signal, computed, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ─────────────────────────────────────────────────────────────────────────────
// Simulated URL query params state (replaces ActivatedRoute in single-file demo)
// ─────────────────────────────────────────────────────────────────────────────

type QueryParams = Record<string, string | string[] | null>;

const urlQueryParams = signal<QueryParams>({ q: '', page: '1', category: null, price: 'all' });
const urlFragment    = signal<string>('');

function mergeQueryParams(newParams: QueryParams): void {
  urlQueryParams.set({ ...urlQueryParams(), ...newParams });
}

function setQueryParams(newParams: QueryParams): void {
  urlQueryParams.set(newParams);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. ProductSearchComponent — reads ?q=, ?page=, ?category=
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-product-search',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div style="padding:1rem; background:#e3f2fd; border-radius:8px; margin-bottom:1rem">
      <h3>Product Search</h3>

      <div style="display:flex; gap:0.75rem; align-items:center; flex-wrap:wrap">
        <input
          [(ngModel)]="searchQuery"
          (ngModelChange)="onSearchChange($event)"
          placeholder="Search products..."
          style="padding:0.4rem 0.75rem; border:1px solid #90caf9; border-radius:4px; flex:1; min-width:200px"
        />
      </div>

      <div style="margin-top:0.75rem; font-size:0.9rem; background:white; padding:0.5rem 0.75rem; border-radius:4px">
        <strong>Active Query Params:</strong><br/>
        <code>?q={{ params().q }}&amp;page={{ params().page }}&amp;category={{ params().category ?? 'all' }}</code>
      </div>

      <div style="margin-top:0.75rem; font-size:0.85rem; background:#e8f5e9; padding:0.75rem; border-radius:4px">
        <strong>Real Angular Pattern:</strong><br/>
        <pre style="margin:0; font-size:0.8rem">{{ realPattern }}</pre>
      </div>
    </div>
  `,
})
export class ProductSearchComponent {
  params = urlQueryParams;
  searchQuery = '';

  onSearchChange(value: string) {
    /*
    // REAL PATTERN:
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: value },
      queryParamsHandling: 'merge', // keeps ?page= and ?category=
    });
    */
    mergeQueryParams({ q: value, page: '1' }); // reset to page 1 on new search
  }

  realPattern = `
// In component:
private route  = inject(ActivatedRoute);
private router = inject(Router);

constructor() {
  // subscribe to queryParamMap changes reactively
  this.route.queryParamMap.subscribe(params => {
    this.q        = params.get('q')        ?? '';
    this.page     = Number(params.get('page')) || 1;
    this.category = params.get('category') ?? null;
  });
}

onSearchChange(value: string) {
  this.router.navigate([], {
    relativeTo: this.route,
    queryParams: { q: value, page: 1 },
    queryParamsHandling: 'merge',
  });
}`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PaginationComponent — updates ?page= via router.navigate
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    <div style="padding:1rem; background:#fff3e0; border-radius:8px; margin-bottom:1rem">
      <h3>Pagination</h3>

      <div style="display:flex; align-items:center; gap:1rem">
        <button
          (click)="prevPage()"
          [disabled]="currentPage() <= 1"
          style="padding:0.4rem 0.75rem; border:1px solid #fb8c00; border-radius:4px; cursor:pointer"
        >← Prev</button>

        <span>Page <strong>{{ currentPage() }}</strong> of <strong>{{ totalPages }}</strong></span>

        <button
          (click)="nextPage()"
          [disabled]="currentPage() >= totalPages"
          style="padding:0.4rem 0.75rem; border:1px solid #fb8c00; border-radius:4px; cursor:pointer"
        >Next →</button>
      </div>

      <p style="font-size:0.85rem; color:#555; margin-top:0.5rem">
        Uses <code>queryParamsHandling: 'merge'</code> to preserve
        <code>?q=</code> and <code>?category=</code> while updating <code>?page=</code>.
      </p>
    </div>
  `,
})
export class PaginationComponent {
  @Input() totalPages = 10;

  currentPage = computed(() => Number(urlQueryParams()['page']) || 1);

  prevPage() {
    const p = this.currentPage();
    if (p > 1) {
      /*
      // REAL:
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { page: p - 1 },
        queryParamsHandling: 'merge',
      });
      */
      mergeQueryParams({ page: String(p - 1) });
    }
  }

  nextPage() {
    const p = this.currentPage();
    if (p < this.totalPages) {
      mergeQueryParams({ page: String(p + 1) });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. FilterComponent — writes multiple query params
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div style="padding:1rem; background:#f3e5f5; border-radius:8px; margin-bottom:1rem">
      <h3>Filters</h3>

      <div style="display:flex; gap:2rem; flex-wrap:wrap">
        <div>
          <strong>Category:</strong>
          @for (cat of categories; track cat) {
            <label style="display:block; margin:0.25rem 0; cursor:pointer">
              <input type="checkbox"
                     [checked]="selectedCategories().includes(cat)"
                     (change)="toggleCategory(cat)"
              /> {{ cat }}
            </label>
          }
        </div>

        <div>
          <strong>Price Range:</strong>
          <select [(ngModel)]="selectedPrice" (ngModelChange)="applyFilters()"
                  style="display:block; margin-top:0.5rem; padding:0.3rem; border:1px solid #ccc; border-radius:4px">
            <option value="all">All Prices</option>
            <option value="under50">Under $50</option>
            <option value="50to100">$50 – $100</option>
            <option value="over100">Over $100</option>
          </select>
        </div>
      </div>

      <div style="margin-top:0.75rem; font-size:0.85rem; background:white; padding:0.5rem 0.75rem; border-radius:4px">
        Active: <code>?category={{ params().category ?? 'none' }}&amp;price={{ params().price }}</code>
      </div>
    </div>
  `,
})
export class FilterComponent {
  categories = ['Electronics', 'Books', 'Clothing'];
  params = urlQueryParams;
  selectedPrice = 'all';

  selectedCategories = computed(() => {
    const cat = urlQueryParams()['category'];
    if (!cat) return [];
    return Array.isArray(cat) ? cat : [cat];
  });

  toggleCategory(cat: string) {
    const current = [...this.selectedCategories()];
    const idx = current.indexOf(cat);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(cat);
    this.applyWithCategory(current.length ? current.join(',') : null);
  }

  applyWithCategory(category: string | null) {
    mergeQueryParams({ category, price: this.selectedPrice, page: '1' });
  }

  applyFilters() {
    const cat = this.selectedCategories().join(',') || null;
    mergeQueryParams({ category: cat, price: this.selectedPrice, page: '1' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. FragmentNavigationComponent
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-fragment-nav',
  standalone: true,
  template: `
    <div style="padding:1rem; background:#e0f7fa; border-radius:8px; margin-bottom:1rem">
      <h3>Fragment Navigation (#anchor)</h3>

      <div style="display:flex; gap:0.5rem; margin-bottom:1rem">
        @for (section of sections; track section.id) {
          <button (click)="navigateTo(section.id)"
                  [style.background]="currentFragment() === section.id ? '#00838f' : '#eee'"
                  [style.color]="currentFragment() === section.id ? 'white' : '#333'"
                  style="padding:0.3rem 0.75rem; border:1px solid #00838f; border-radius:4px; cursor:pointer">
            #{{ section.id }}
          </button>
        }
        <button (click)="clearFragment()"
                style="padding:0.3rem 0.75rem; border:1px solid #ccc; border-radius:4px; cursor:pointer">
          Clear
        </button>
      </div>

      <div style="font-size:0.9rem; background:white; padding:0.5rem 0.75rem; border-radius:4px; margin-bottom:0.75rem">
        Current fragment: <code>#{{ currentFragment() || '(none)' }}</code>
      </div>

      @for (section of sections; track section.id) {
        <div [id]="section.id"
             [style.background]="currentFragment() === section.id ? '#b2ebf2' : '#f5f5f5'"
             style="padding:0.75rem; border-radius:4px; margin-bottom:0.5rem; transition:background 0.3s">
          <strong>{{ section.title }}</strong>
          <p style="margin:0.25rem 0 0; font-size:0.9rem">{{ section.body }}</p>
        </div>
      }

      <div style="margin-top:0.75rem; font-size:0.85rem; background:#e8f5e9; padding:0.75rem; border-radius:4px">
        <strong>Real patterns:</strong><br/>
        <code>router.navigate([], &#123; fragment: 'details' &#125;)</code><br/>
        <code>&lt;a routerLink="." fragment="details"&gt;Details&lt;/a&gt;</code><br/>
        <code>route.fragment.subscribe(f => this.currentFragment.set(f))</code>
      </div>
    </div>
  `,
})
export class FragmentNavigationComponent {
  sections = [
    { id: 'intro',   title: 'Introduction', body: 'Welcome to the product page.' },
    { id: 'details', title: 'Details',      body: 'Technical specifications and features.' },
    { id: 'contact', title: 'Contact',      body: 'Reach us at support@example.com' },
  ];

  currentFragment = urlFragment;

  navigateTo(fragment: string) {
    /*
    // REAL:
    this.router.navigate([], { fragment });
    // Read: this.route.fragment.subscribe(f => this.currentFragment.set(f ?? ''));
    */
    urlFragment.set(fragment);
  }

  clearFragment() { urlFragment.set(''); }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. QueryParamsHandling demo
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-qp-handling',
  standalone: true,
  template: `
    <div style="padding:1rem; background:#fce4ec; border-radius:8px; margin-bottom:1rem">
      <h3>queryParamsHandling Strategies</h3>

      <div style="font-size:0.9rem; margin-bottom:0.75rem; background:white; padding:0.5rem 0.75rem; border-radius:4px">
        Current params: <code>{{ paramsString() }}</code>
      </div>

      <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.75rem">
        <button (click)="setBase()"
                style="padding:0.4rem 0.75rem; background:#666; color:white; border:none; border-radius:4px; cursor:pointer">
          Set base params (q=hello&amp;page=3)
        </button>
        <button (click)="navigate('merge')"
                style="padding:0.4rem 0.75rem; background:#2e7d32; color:white; border:none; border-radius:4px; cursor:pointer">
          merge (add sort=asc)
        </button>
        <button (click)="navigate('preserve')"
                style="padding:0.4rem 0.75rem; background:#e65100; color:white; border:none; border-radius:4px; cursor:pointer">
          preserve (add sort=asc, ignored)
        </button>
        <button (click)="navigate('replace')"
                style="padding:0.4rem 0.75rem; background:#c62828; color:white; border:none; border-radius:4px; cursor:pointer">
          replace (only sort=asc)
        </button>
      </div>

      <table style="width:100%; border-collapse:collapse; font-size:0.85rem">
        <thead>
          <tr style="background:#ad1457; color:white">
            <th style="padding:0.4rem">Strategy</th>
            <th style="padding:0.4rem">Result (base: q=hello&amp;page=3, new: sort=asc)</th>
          </tr>
        </thead>
        <tbody>
          @for (row of strategies; track row.strategy) {
            <tr style="border-bottom:1px solid #ddd">
              <td style="padding:0.4rem"><code>'{{ row.strategy }}'</code></td>
              <td style="padding:0.4rem"><code>{{ row.result }}</code></td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class QueryParamsHandlingComponent {
  params = urlQueryParams;

  strategies = [
    { strategy: 'merge',    result: '?q=hello&page=3&sort=asc (keeps existing, adds new)' },
    { strategy: 'preserve', result: '?q=hello&page=3 (keeps existing, ignores new)'       },
    { strategy: '',         result: '?sort=asc (replaces all with new params)'             },
  ];

  paramsString = computed(() => {
    const p = urlQueryParams();
    return Object.entries(p)
      .filter(([, v]) => v !== null && v !== '')
      .map(([k, v]) => `${k}=${v}`)
      .join('&') || '(empty)';
  });

  setBase() {
    setQueryParams({ q: 'hello', page: '3' });
  }

  navigate(strategy: 'merge' | 'preserve' | 'replace') {
    const newParam = { sort: 'asc' };
    if (strategy === 'merge') {
      mergeQueryParams(newParam);
    } else if (strategy === 'preserve') {
      // preserve: keep existing, don't add new (no-op on new key)
      // already has existing; do nothing to them:
      urlQueryParams.set({ ...urlQueryParams() });
    } else {
      setQueryParams(newParam);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ProductSearchComponent,
    PaginationComponent,
    FilterComponent,
    FragmentNavigationComponent,
    QueryParamsHandlingComponent,
  ],
  template: `
    <div style="font-family:sans-serif; max-width:800px; margin:2rem auto; padding:0 1rem">
      <h1>Phase 4 – Query Params Demo</h1>

      <app-product-search />
      <app-pagination [totalPages]="10" />
      <app-filter />
      <app-fragment-nav />
      <app-qp-handling />

      <div style="margin-top:1.5rem; padding:1rem; background:#f5f5f5; border-radius:8px; font-size:0.85rem">
        <strong>Query Params Cheat Sheet:</strong>
        <ul>
          <li>Read: <code>route.queryParamMap.subscribe(m => m.get('q'))</code></li>
          <li>Write: <code>router.navigate([], &#123; queryParams: &#123; q: val &#125;, queryParamsHandling: 'merge' &#125;)</code></li>
          <li><code>'merge'</code> — keeps existing params, adds/updates supplied ones</li>
          <li><code>'preserve'</code> — keeps existing params, supplied ones are ignored</li>
          <li><code>''</code> (default) — replaces all query params with the supplied object</li>
          <li>Fragment: <code>router.navigate([], &#123; fragment: 'section-id' &#125;)</code></li>
          <li>Template: <code>&lt;a routerLink="." [queryParams]="&#123;q:'val'&#125;" queryParamsHandling="merge"&gt;</code></li>
        </ul>
      </div>
    </div>
  `,
})
export class AppComponent {}
