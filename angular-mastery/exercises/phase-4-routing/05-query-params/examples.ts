import { Component, signal, computed } from '@angular/core';

// ============================================================
// Examples 4.5 — Query Params & Route Params (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. queryParams concept — explanation + code display
@Component({
  selector: 'ex-01', standalone: true,
  template: `
    <p><strong>Query params concept:</strong></p>
    <p>Query parameters appear after <code>?</code> in the URL and are key=value pairs separated by <code>&amp;</code>.</p>
    <pre>
// URL: /products?category=shoes&sort=price&page=2
// - category = 'shoes'  (filter)
// - sort     = 'price'  (ordering)
// - page     = '2'      (pagination)

// All query param values are strings — you must coerce to number/boolean yourself.</pre>
    <p>Unlike route params (<code>:id</code>), query params are <em>optional</em> and do not affect route matching.</p>
  `
})
class Ex01 {}

// 2. RouterLink queryParams — code display
@Component({
  selector: 'ex-02', standalone: true,
  template: `
    <p><strong>RouterLink with queryParams:</strong></p>
    <pre>
&lt;!-- Static queryParams object --&gt;
&lt;a [routerLink]="['/products']"
   [queryParams]="{{ '{' }} category: 'shoes', sort: 'price' {{ '}' }}"&gt;
  Shoes sorted by price
&lt;/a&gt;
&lt;!-- URL: /products?category=shoes&amp;sort=price --&gt;

&lt;!-- Dynamic queryParams from component --&gt;
&lt;a [routerLink]="['/search']"
   [queryParams]="searchParams"&gt;Search&lt;/a&gt;

// In component:
searchParams = {{ '{' }} q: this.query(), page: this.page() {{ '}' }}</pre>
  `
})
class Ex02 {}

// 3. Read queryParams with signal (simulated URL state)
@Component({
  selector: 'ex-03', standalone: true,
  template: `
    <p><strong>Reading queryParams (simulated as signal):</strong></p>
    <div style="font-size:13px">
      <label>Simulate URL queryParam <code>?category=</code>:
        <input [value]="category()" (input)="category.set(getValue($event))"
          style="margin-left:8px;padding:2px 6px" />
      </label>
      <p>Active category: <strong>{{ category() || '(none)' }}</strong></p>
      <p style="color:#718096">In real code: <code>route.queryParams.subscribe(p =&gt; this.category = p['category'])</code></p>
    </div>
  `
})
class Ex03 {
  category = signal('');
  getValue(e: Event) { return (e.target as HTMLInputElement).value; }
}

// 4. Read route param (simulated :id signal)
@Component({
  selector: 'ex-04', standalone: true,
  template: `
    <p><strong>Reading a route param :id (simulated):</strong></p>
    <div style="font-size:13px">
      <label>Simulate URL <code>/products/:id</code> — id:
        <input type="number" [value]="productId()" (input)="productId.set(+getValue($event))"
          style="margin-left:8px;width:60px;padding:2px 6px" />
      </label>
      <p>Loading product: <strong>#{{ productId() }}</strong></p>
      <p style="color:#718096">In real code: <code>route.params.subscribe(p =&gt; this.id = +p['id'])</code></p>
    </div>
  `
})
class Ex04 {
  productId = signal(1);
  getValue(e: Event) { return (e.target as HTMLInputElement).value; }
}

// 5. Snapshot queryParams pattern — code display
@Component({
  selector: 'ex-05', standalone: true,
  template: `
    <p><strong>Snapshot vs Observable for queryParams:</strong></p>
    <pre>
// Snapshot (one-time read — OK for params that won't change while component is alive):
const category = this.route.snapshot.queryParamMap.get('category');
const id       = this.route.snapshot.paramMap.get('id');

// Observable (reactive — updates if URL changes without destroying component):
this.route.queryParamMap.pipe(
  map(params => params.get('category'))
).subscribe(cat => this.category = cat);

// ⚠️ Avoid snapshot in components that can be re-used across navigations
// (e.g., navigating from /products/1 to /products/2 reuses the component)</pre>
  `
})
class Ex05 {}

// 6. queryParamsHandling: 'merge' — code display
@Component({
  selector: 'ex-06', standalone: true,
  template: `
    <p><strong>queryParamsHandling: 'merge' — add to existing params:</strong></p>
    <pre>
// Current URL: /products?category=shoes&page=2

// With 'merge': preserves existing, adds/overwrites new
&lt;a [routerLink]="['/products']"
   [queryParams]="{{ '{' }} sort: 'price' {{ '}' }}"
   queryParamsHandling="merge"&gt;Sort by price&lt;/a&gt;
// Result URL: /products?category=shoes&amp;page=2&amp;sort=price

// Programmatically:
router.navigate(['/products'], {{ '{' }}
  queryParams: {{ '{' }} sort: 'price' {{ '}' }},
  queryParamsHandling: 'merge'
{{ '}' }});</pre>
  `
})
class Ex06 {}

// 7. queryParamsHandling: 'preserve' — code display
@Component({
  selector: 'ex-07', standalone: true,
  template: `
    <p><strong>queryParamsHandling: 'preserve' — keep existing, add none:</strong></p>
    <pre>
// Current URL: /products?category=shoes&sort=price

// 'preserve': ignores new queryParams entirely, keeps current ones
&lt;a [routerLink]="['/products/detail']"
   queryParamsHandling="preserve"&gt;View Detail&lt;/a&gt;
// Result URL: /products/detail?category=shoes&amp;sort=price

// Use case: pagination links that should carry all current filters through.

// vs 'merge': use 'merge' to ADD params, 'preserve' to CARRY ALL params unchanged.</pre>
  `
})
class Ex07 {}

// 8. Fragment navigation — code display
@Component({
  selector: 'ex-08', standalone: true,
  template: `
    <p><strong>Fragment (#anchor) navigation:</strong></p>
    <pre>
&lt;!-- Template: --&gt;
&lt;a [routerLink]="['/docs']" fragment="installation"&gt;
  Jump to Installation
&lt;/a&gt;
&lt;!-- URL: /docs#installation --&gt;

// Programmatically:
router.navigate(['/docs'], {{ '{' }} fragment: 'installation' {{ '}' }});

// Reading the fragment:
this.route.fragment.subscribe(f => this.fragment = f); // 'installation'

// Enable anchor scrolling:
provideRouter(routes, withInMemoryScrolling({{ '{' }} anchorScrolling: 'enabled' {{ '}' }}))</pre>
  `
})
class Ex08 {}

// 9. Route params vs query params — comparison component
@Component({
  selector: 'ex-09', standalone: true,
  template: `
    <p><strong>Route params vs Query params — comparison:</strong></p>
    <table style="border-collapse:collapse;font-size:12px;width:100%">
      <tr style="background:#edf2f7">
        <th style="padding:5px 8px;border:1px solid #cbd5e0">Feature</th>
        <th style="padding:5px 8px;border:1px solid #cbd5e0">Route Param (:id)</th>
        <th style="padding:5px 8px;border:1px solid #cbd5e0">Query Param (?key=val)</th>
      </tr>
      @for (row of rows; track row.feature) {
        <tr>
          <td style="padding:5px 8px;border:1px solid #cbd5e0;font-weight:500">{{ row.feature }}</td>
          <td style="padding:5px 8px;border:1px solid #cbd5e0">{{ row.route }}</td>
          <td style="padding:5px 8px;border:1px solid #cbd5e0">{{ row.query }}</td>
        </tr>
      }
    </table>
  `
})
class Ex09 {
  rows = [
    { feature: 'Required',    route: 'Yes — part of path',      query: 'Optional' },
    { feature: 'Affects match', route: 'Yes',                   query: 'No' },
    { feature: 'Use case',    route: 'Resource identity (/items/42)', query: 'Filters, sort, page' },
    { feature: 'Access',      route: 'route.params / paramMap', query: 'route.queryParams / queryParamMap' },
    { feature: 'Multiple',    route: '/a/:x/b/:y',              query: '?x=1&y=2' },
  ];
}

// 10. String queryParam display
@Component({
  selector: 'ex-10', standalone: true,
  template: `
    <p><strong>String queryParam — basic read and display:</strong></p>
    <div style="font-size:13px">
      <input [value]="search()" (input)="search.set(getValue($event))"
        placeholder="Type search..." style="padding:4px 8px" />
      <p>URL would be: <code>/results?q={{ search() || '' }}</code></p>
      <p>Showing results for: <strong>{{ search() || '(all)' }}</strong></p>
    </div>
  `
})
class Ex10 {
  search = signal('');
  getValue(e: Event) { return (e.target as HTMLInputElement).value; }
}

// 11. Number queryParam (parseInt signal)
@Component({
  selector: 'ex-11', standalone: true,
  template: `
    <p><strong>Number queryParam — coerce string to number:</strong></p>
    <div style="font-size:13px">
      <label>Page: <input type="number" min="1" [value]="page()"
        (input)="setPage($event)" style="width:60px;padding:2px 4px" /></label>
      <p>URL: <code>/items?page={{ page() }}</code></p>
      <p>Showing page <strong>{{ page() }}</strong> (typeof: number → {{ typeof(page()) }})</p>
      <pre>// Read and coerce:
const raw = route.snapshot.queryParamMap.get('page'); // '2' (string)
const page = parseInt(raw ?? '1', 10);                // 2 (number)</pre>
    </div>
  `
})
class Ex11 {
  page = signal(1);
  typeof(v: unknown) { return typeof v; }
  setPage(e: Event) {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    if (!isNaN(val) && val > 0) this.page.set(val);
  }
}

// 12. Boolean queryParam ('true'/'false' coerce)
@Component({
  selector: 'ex-12', standalone: true,
  template: `
    <p><strong>Boolean queryParam — coerce 'true'/'false' string:</strong></p>
    <div style="font-size:13px">
      <label>
        <input type="checkbox" [checked]="showArchived()"
          (change)="showArchived.set(($event.target as HTMLInputElement).checked)" />
        Show archived
      </label>
      <p>URL: <code>/items?archived={{ showArchived() }}</code></p>
      <p>Value: <strong>{{ showArchived() }}</strong> (boolean)</p>
      <pre>// Coerce:
const raw = route.snapshot.queryParamMap.get('archived'); // 'true' | 'false' | null
const archived = raw === 'true'; // boolean</pre>
    </div>
  `
})
class Ex12 {
  showArchived = signal(false);
}

// 13. Required vs optional params — code display
@Component({
  selector: 'ex-13', standalone: true,
  template: `
    <p><strong>Required vs optional params — when to use each:</strong></p>
    <table style="border-collapse:collapse;font-size:12px;width:100%">
      <tr style="background:#edf2f7">
        <th style="padding:4px 8px;border:1px solid #cbd5e0">Type</th>
        <th style="padding:4px 8px;border:1px solid #cbd5e0">Example URL</th>
        <th style="padding:4px 8px;border:1px solid #cbd5e0">Use for</th>
      </tr>
      @for (r of rows; track r.type) {
        <tr>
          <td style="padding:4px 8px;border:1px solid #cbd5e0">{{ r.type }}</td>
          <td style="padding:4px 8px;border:1px solid #cbd5e0"><code>{{ r.url }}</code></td>
          <td style="padding:4px 8px;border:1px solid #cbd5e0">{{ r.use }}</td>
        </tr>
      }
    </table>
  `
})
class Ex13 {
  rows = [
    { type: 'Required (route)',    url: '/products/:id',             use: 'Resource ID — always needed' },
    { type: 'Optional (query)',    url: '/products?sort=price',      use: 'Filters, sorting, pagination' },
    { type: 'Optional (matrix)',   url: '/products;color=red',       use: 'Segment-local state (rare)' },
  ];
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────

// 14. Multiple queryParams (filter + sort + page) — signal state
@Component({
  selector: 'ex-14', standalone: true,
  template: `
    <p><strong>Multiple queryParams — filter + sort + page:</strong></p>
    <div style="font-size:13px">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
        <label>Category:
          <select (change)="category.set(getValue($event))">
            @for (c of categories; track c) { <option [value]="c">{{ c }}</option> }
          </select>
        </label>
        <label>Sort:
          <select (change)="sort.set(getValue($event))">
            <option value="price">Price</option>
            <option value="name">Name</option>
            <option value="date">Date</option>
          </select>
        </label>
        <label>Page: <input type="number" min="1" [value]="page()"
          (input)="page.set(+getValue($event))" style="width:50px" /></label>
      </div>
      <code>/products?category={{ category() }}&amp;sort={{ sort() }}&amp;page={{ page() }}</code>
    </div>
  `
})
class Ex14 {
  categories = ['all', 'shoes', 'bags', 'accessories'];
  category = signal('all');
  sort = signal('price');
  page = signal(1);
  getValue(e: Event) { return (e.target as HTMLSelectElement | HTMLInputElement).value; }
}

// 15. Array queryParam (repeated key) — code display
@Component({
  selector: 'ex-15', standalone: true,
  template: `
    <p><strong>Array queryParam — repeated key encoding:</strong></p>
    <pre>
// URL: /products?tag=angular&tag=typescript&tag=rxjs
// Angular Router encodes arrays as repeated keys.

// RouterLink:
[queryParams]="{{ '{' }} tag: ['angular', 'typescript', 'rxjs'] {{ '}' }}"

// Reading:
this.route.queryParamMap.subscribe(params => {{
  '{' }}
  const tags = params.getAll('tag'); // ['angular', 'typescript', 'rxjs']
{{ '}' }});</pre>
    <p>Use <code>getAll()</code> (not <code>get()</code>) to retrieve all values for a repeated key.</p>
  `
})
class Ex15 {}

// 16. queryParam-driven filter UI (category signal)
@Component({
  selector: 'ex-16', standalone: true,
  template: `
    <p><strong>queryParam-driven filter UI:</strong></p>
    <div style="font-size:13px">
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
        @for (c of categories; track c) {
          <button
            [style.background]="active() === c ? '#4299e1' : '#e2e8f0'"
            [style.color]="active() === c ? '#fff' : '#4a5568'"
            style="padding:4px 10px;border:none;border-radius:4px;cursor:pointer"
            (click)="active.set(c)">
            {{ c }}
          </button>
        }
      </div>
      <code>/products?category={{ active() === 'All' ? '' : active() }}</code>
      <p>Filtered results: showing <strong>{{ active() }}</strong> items</p>
    </div>
  `
})
class Ex16 {
  categories = ['All', 'Shoes', 'Bags', 'Accessories'];
  active = signal('All');
}

// 17. queryParam-driven sort (asc/desc signal toggle)
@Component({
  selector: 'ex-17', standalone: true,
  template: `
    <p><strong>queryParam-driven sort toggle:</strong></p>
    <div style="font-size:13px">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
        @for (field of fields; track field) {
          <button style="padding:4px 10px;border:1px solid #cbd5e0;border-radius:4px;cursor:pointer"
            [style.fontWeight]="sortField() === field ? 'bold' : 'normal'"
            (click)="setSortField(field)">
            {{ field }}
            @if (sortField() === field) { {{ sortDir() === 'asc' ? '↑' : '↓' }} }
          </button>
        }
      </div>
      <code>/products?sort={{ sortField() }}&amp;dir={{ sortDir() }}</code>
    </div>
  `
})
class Ex17 {
  fields = ['name', 'price', 'date'];
  sortField = signal('name');
  sortDir = signal<'asc' | 'desc'>('asc');
  setSortField(field: string) {
    if (this.sortField() === field) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
  }
}

// 18. queryParam pagination (page + pageSize signals)
@Component({
  selector: 'ex-18', standalone: true,
  template: `
    <p><strong>Pagination via queryParams:</strong></p>
    <div style="font-size:13px">
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
        <button (click)="page.update(p => Math.max(1, p - 1))" [disabled]="page() === 1">← Prev</button>
        <span>Page <strong>{{ page() }}</strong> of {{ totalPages() }}</span>
        <button (click)="page.update(p => Math.min(totalPages(), p + 1))" [disabled]="page() === totalPages()">Next →</button>
        <label>Per page:
          <select (change)="setPageSize($event)">
            @for (s of sizes; track s) { <option [value]="s" [selected]="pageSize() === s">{{ s }}</option> }
          </select>
        </label>
      </div>
      <code>/items?page={{ page() }}&amp;pageSize={{ pageSize() }}</code>
    </div>
  `
})
class Ex18 {
  total = 100;
  page = signal(1);
  pageSize = signal(10);
  sizes = [5, 10, 25, 50];
  totalPages = computed(() => Math.ceil(this.total / this.pageSize()));
  setPageSize(e: Event) {
    this.pageSize.set(+(e.target as HTMLSelectElement).value);
    this.page.set(1);
  }
}

// 19. Search queryParam with debounce (300ms input)
@Component({
  selector: 'ex-19', standalone: true,
  template: `
    <p><strong>Search queryParam with debounce:</strong></p>
    <div style="font-size:13px">
      <input [value]="inputVal()" (input)="onInput($event)"
        placeholder="Search products..." style="padding:4px 8px;width:200px" />
      <p>URL param (debounced 300ms): <code>?q={{ debounced() }}</code></p>
      <p style="color:#718096;font-size:11px">In real code: use RxJS debounceTime(300) on a Subject or signal with debounce.</p>
    </div>
  `
})
class Ex19 {
  inputVal = signal('');
  debounced = signal('');
  private timer: ReturnType<typeof setTimeout> | null = null;
  onInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    this.inputVal.set(val);
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.debounced.set(val), 300);
  }
}

// 20. Update queryParam without full navigation — code display
@Component({
  selector: 'ex-20', standalone: true,
  template: `
    <p><strong>Update queryParam in place (replaceUrl, no new history entry):</strong></p>
    <pre>
// Navigate but REPLACE current history entry (no back-stack push):
router.navigate([], {{ '{' }}
  relativeTo: this.route,
  queryParams: {{ '{' }} sort: 'price' {{ '}' }},
  queryParamsHandling: 'merge',
  replaceUrl: true          // &lt;— key option
{{ '}' }});

// Use case: updating filter/sort without cluttering browser history.
// User pressing Back skips intermediate filter states.</pre>
  `
})
class Ex20 {}

// 21. Remove queryParam (set to undefined) — code display
@Component({
  selector: 'ex-21', standalone: true,
  template: `
    <p><strong>Remove a queryParam from URL (set to undefined/null):</strong></p>
    <pre>
// To remove 'category' param from the URL:
router.navigate([], {{ '{' }}
  relativeTo: this.route,
  queryParams: {{ '{' }} category: undefined {{ '}' }},  // or null
  queryParamsHandling: 'merge'
{{ '}' }});
// Before: /products?category=shoes&sort=price
// After:  /products?sort=price

// Setting a param to undefined removes it.
// Setting to null also removes it.
// Setting to '' keeps the key with an empty value: ?category=</pre>
  `
})
class Ex21 {}

// 22. queryParam in resolver — code display
@Component({
  selector: 'ex-22', standalone: true,
  template: `
    <p><strong>Reading queryParams inside a resolver:</strong></p>
    <pre>
// Functional resolver that uses queryParams:
export const productsResolver: ResolveFn&lt;Product[]&gt; =
  (route: ActivatedRouteSnapshot) => {{ '{' }}
    const category = route.queryParamMap.get('category') ?? 'all';
    const sort     = route.queryParamMap.get('sort') ?? 'name';
    const page     = parseInt(route.queryParamMap.get('page') ?? '1', 10);

    return inject(ProductService).list({{ '{' }} category, sort, page {{ '}' }});
  {{ '}' }};

// Route config:
{{ '{' }} path: 'products', component: ProductsComponent, resolve: {{ '{' }} data: productsResolver {{ '}' }} {{ '}' }}</pre>
  `
})
class Ex22 {}

// 23. queryParam in guard — code display
@Component({
  selector: 'ex-23', standalone: true,
  template: `
    <p><strong>Reading queryParams inside a guard:</strong></p>
    <pre>
// Functional guard that checks a 'token' queryParam:
export const tokenGuard: CanActivateFn =
  (route: ActivatedRouteSnapshot) => {{ '{' }}
    const token = route.queryParamMap.get('token');
    if (token && inject(AuthService).validateToken(token)) {{ '{' }}
      return true;
    {{ '}' }}
    return inject(Router).createUrlTree(['/login']);
  {{ '}' }};

// Use case: magic-link login — /verify?token=abc123</pre>
  `
})
class Ex23 {}

// 24. Fragment + queryParams combined — code display
@Component({
  selector: 'ex-24', standalone: true,
  template: `
    <p><strong>Fragment + queryParams combined:</strong></p>
    <pre>
// URL: /docs?version=17&lang=ts#installation

&lt;a [routerLink]="['/docs']"
   [queryParams]="{{ '{' }} version: 17, lang: 'ts' {{ '}' }}"
   fragment="installation"&gt;
  Angular 17 Installation
&lt;/a&gt;

// Programmatically:
router.navigate(['/docs'], {{ '{' }}
  queryParams: {{ '{' }} version: 17, lang: 'ts' {{ '}' }},
  fragment: 'installation'
{{ '}' }});

// Reading fragment:
this.route.fragment.subscribe(f => this.anchor = f); // 'installation'</pre>
  `
})
class Ex24 {}

// 25. withComponentInputBinding queryParam as @Input — code display
@Component({
  selector: 'ex-25', standalone: true,
  template: `
    <p><strong>withComponentInputBinding — queryParams as @Input (Angular 16+):</strong></p>
    <pre>
// Enable in app config:
provideRouter(routes, withComponentInputBinding())

// Component receives queryParams directly as @Input:
@Component({{ '{' }} ... {{ '}' }})
class ProductsComponent {{ '{' }}
  @Input() category = '';   // maps from ?category=shoes
  @Input() sort = 'name';   // maps from ?sort=price
  @Input() page = '1';      // maps from ?page=2 (still a string)
{{ '}' }}

// Also works for route params:
@Input() id = '';  // maps from /products/:id</pre>
  `
})
class Ex25 {}

// 26. toSignal(route.queryParamMap) pattern — code display
@Component({
  selector: 'ex-26', standalone: true,
  template: `
    <p><strong>toSignal() with route.queryParamMap (Angular 16+):</strong></p>
    <pre>
import {{ '{' }} toSignal {{ '}' }} from '@angular/core/rxjs-interop';

@Component({{ '{' }} ... {{ '}' }})
class ProductsComponent {{ '{' }}
  private route = inject(ActivatedRoute);

  private paramMap = toSignal(this.route.queryParamMap);

  category = computed(() => this.paramMap()?.get('category') ?? 'all');
  sort     = computed(() => this.paramMap()?.get('sort') ?? 'name');
  page     = computed(() => parseInt(this.paramMap()?.get('page') ?? '1', 10));

  // Fully reactive — no subscribe/unsubscribe needed!
{{ '}' }}</pre>
  `
})
class Ex26 {}

// ─── NESTED (27–38) ──────────────────────────────────────────

// 27. Full filter panel (category + status + price) — signal state
@Component({
  selector: 'ex-27', standalone: true,
  template: `
    <p><strong>Full filter panel — all state in URL queryParams (signal simulation):</strong></p>
    <div style="font-size:13px">
      <div style="display:flex;gap:12px;flex-wrap:wrap;padding:8px;background:#f7fafc;border-radius:4px;margin-bottom:8px">
        <label>Category:
          <select (change)="category.set(getValue($event))">
            @for (c of categories; track c) { <option [value]="c">{{ c }}</option> }
          </select>
        </label>
        <label>Status:
          <select (change)="status.set(getValue($event))">
            @for (s of statuses; track s) { <option [value]="s">{{ s }}</option> }
          </select>
        </label>
        <label>Max price:
          <input type="range" min="0" max="500" [value]="maxPrice()"
            (input)="maxPrice.set(+getValue($event))" style="width:80px" />
          ${{ maxPrice() }}
        </label>
        <button (click)="reset()">Reset</button>
      </div>
      <code style="font-size:11px">{{ url() }}</code>
    </div>
  `
})
class Ex27 {
  categories = ['all', 'shoes', 'bags', 'accessories'];
  statuses   = ['all', 'in-stock', 'sale', 'new'];
  category   = signal('all');
  status     = signal('all');
  maxPrice   = signal(500);
  url = computed(() => {
    const params = [];
    if (this.category() !== 'all') params.push(`category=${this.category()}`);
    if (this.status() !== 'all') params.push(`status=${this.status()}`);
    if (this.maxPrice() < 500) params.push(`maxPrice=${this.maxPrice()}`);
    return `/products${params.length ? '?' + params.join('&') : ''}`;
  });
  getValue(e: Event) { return (e.target as HTMLSelectElement | HTMLInputElement).value; }
  reset() { this.category.set('all'); this.status.set('all'); this.maxPrice.set(500); }
}

// 28. Search + filter + sort all in URL (signal state)
@Component({
  selector: 'ex-28', standalone: true,
  template: `
    <p><strong>Search + filter + sort — full URL state:</strong></p>
    <div style="font-size:13px">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
        <input [value]="q()" (input)="q.set(getValue($event))"
          placeholder="Search..." style="padding:3px 6px" />
        <select (change)="category.set(getValue($event))">
          @for (c of ['all','shoes','bags']; track c) { <option [value]="c">{{ c }}</option> }
        </select>
        <select (change)="sort.set(getValue($event))">
          @for (s of ['name','price','date']; track s) { <option [value]="s">Sort: {{ s }}</option> }
        </select>
      </div>
      <code style="font-size:11px">{{ url() }}</code>
      <p>Results count: {{ resultCount() }}</p>
    </div>
  `
})
class Ex28 {
  q        = signal('');
  category = signal('all');
  sort     = signal('name');
  url = computed(() => {
    const p: string[] = [];
    if (this.q())              p.push(`q=${encodeURIComponent(this.q())}`);
    if (this.category() !== 'all') p.push(`category=${this.category()}`);
    p.push(`sort=${this.sort()}`);
    return `/products?${p.join('&')}`;
  });
  resultCount = computed(() => Math.floor(Math.random() * 50) + this.q().length);
  getValue(e: Event) { return (e.target as HTMLSelectElement | HTMLInputElement).value; }
}

// 29. Pagination component (page/limit signals + display)
@Component({
  selector: 'ex-29', standalone: true,
  template: `
    <p><strong>Pagination component with queryParam sync:</strong></p>
    <div style="font-size:13px">
      <div style="margin-bottom:6px">Total: <strong>{{ total }}</strong> items | Page: <strong>{{ page() }}</strong>/{{ totalPages() }} | Limit: <strong>{{ limit() }}</strong></div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">
        <button (click)="page.set(1)" [disabled]="page() === 1">«</button>
        <button (click)="page.update(p => p - 1)" [disabled]="page() === 1">‹</button>
        @for (p of pageNums(); track p) {
          <button (click)="page.set(p)"
            [style.fontWeight]="page() === p ? 'bold' : 'normal'"
            [style.background]="page() === p ? '#4299e1' : '#e2e8f0'"
            [style.color]="page() === p ? '#fff' : '#4a5568'"
            style="padding:2px 8px;border:none;border-radius:3px;cursor:pointer">{{ p }}</button>
        }
        <button (click)="page.update(p => p + 1)" [disabled]="page() === totalPages()">›</button>
        <button (click)="page.set(totalPages())" [disabled]="page() === totalPages()">»</button>
      </div>
      <code style="font-size:11px">?page={{ page() }}&limit={{ limit() }}</code>
    </div>
  `
})
class Ex29 {
  total     = 100;
  page      = signal(1);
  limit     = signal(10);
  totalPages = computed(() => Math.ceil(this.total / this.limit()));
  pageNums  = computed(() => Array.from({ length: Math.min(5, this.totalPages()) }, (_, i) => {
    const start = Math.max(1, this.page() - 2);
    return Math.min(start + i, this.totalPages());
  }).filter((v, i, a) => a.indexOf(v) === i));
}

// 30. List page with all queryParam state
@Component({
  selector: 'ex-30', standalone: true,
  template: `
    <p><strong>Full list page with queryParam-driven state:</strong></p>
    <div style="font-size:13px">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;padding:6px;background:#f7fafc">
        <input [value]="q()" (input)="q.set(getVal($event))" placeholder="Search..." style="padding:3px 6px" />
        <select (change)="status.set(getVal($event))">
          @for (s of ['active','inactive','pending']; track s) { <option>{{ s }}</option> }
        </select>
        <button (click)="toggleSort()">Sort: {{ sortField() }} {{ sortDir() === 'asc' ? '↑' : '↓' }}</button>
        <button (click)="reset()" style="margin-left:auto">Reset All</button>
      </div>
      <div>
        @for (item of filtered(); track item) {
          <div style="padding:3px 6px;border-bottom:1px solid #e2e8f0">{{ item }}</div>
        }
      </div>
      <div style="margin-top:6px;font-size:11px">
        <code>{{ urlState() }}</code>
      </div>
    </div>
  `
})
class Ex30 {
  items    = ['Alpha Product', 'Beta Widget', 'Gamma Tool', 'Delta Service', 'Epsilon App'];
  q        = signal('');
  status   = signal('active');
  sortField = signal('name');
  sortDir   = signal<'asc'|'desc'>('asc');
  filtered = computed(() =>
    this.items.filter(i => i.toLowerCase().includes(this.q().toLowerCase()))
      .sort((a, b) => this.sortDir() === 'asc' ? a.localeCompare(b) : b.localeCompare(a))
  );
  urlState = computed(() => {
    const p: string[] = [`status=${this.status()}`, `sort=${this.sortField()}`, `dir=${this.sortDir()}`];
    if (this.q()) p.unshift(`q=${this.q()}`);
    return `/list?${p.join('&')}`;
  });
  toggleSort() { this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc'); }
  reset() { this.q.set(''); this.status.set('active'); this.sortField.set('name'); this.sortDir.set('asc'); }
  getVal(e: Event) { return (e.target as HTMLInputElement | HTMLSelectElement).value; }
}

// 31. Shareable URL state (all filters in signals)
@Component({
  selector: 'ex-31', standalone: true,
  template: `
    <p><strong>Shareable URL — all filter state encoded in queryParams:</strong></p>
    <div style="font-size:13px">
      <p>Copy this URL to share the exact filtered view:</p>
      <div style="display:flex;gap:6px">
        <input [value]="shareUrl()" readonly style="flex:1;padding:4px 6px;font-size:11px;font-family:monospace" />
        <button (click)="copied.set(true)">{{ copied() ? 'Copied!' : 'Copy' }}</button>
      </div>
      <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
        <label>Category: <input [value]="cat()" (input)="cat.set(getVal($event))" style="width:80px" /></label>
        <label>Sort: <input [value]="sort()" (input)="sort.set(getVal($event))" style="width:80px" /></label>
        <label>Page: <input type="number" [value]="page()" (input)="page.set(+getVal($event))" style="width:50px" /></label>
      </div>
    </div>
  `
})
class Ex31 {
  cat    = signal('shoes');
  sort   = signal('price');
  page   = signal(1);
  copied = signal(false);
  shareUrl = computed(() =>
    `https://myapp.com/products?category=${this.cat()}&sort=${this.sort()}&page=${this.page()}`
  );
  getVal(e: Event) { return (e.target as HTMLInputElement).value; }
}

// 32. Tab selection via queryParam (simulated)
@Component({
  selector: 'ex-32', standalone: true,
  template: `
    <p><strong>Tab selection stored in queryParam (bookmarkable):</strong></p>
    <div style="font-size:13px">
      <div style="display:flex;gap:0;border-bottom:2px solid #e2e8f0;margin-bottom:8px">
        @for (tab of tabs; track tab.key) {
          <div style="padding:6px 14px;cursor:pointer"
            [style.borderBottom]="active() === tab.key ? '2px solid #4299e1' : 'none'"
            [style.color]="active() === tab.key ? '#4299e1' : '#718096'"
            (click)="active.set(tab.key)">
            {{ tab.label }}
          </div>
        }
      </div>
      <code style="font-size:11px">/profile?tab={{ active() }}</code>
      <div style="padding:8px">{{ currentTab().content }}</div>
    </div>
  `
})
class Ex32 {
  tabs = [
    { key: 'overview', label: 'Overview', content: 'User overview content.' },
    { key: 'activity', label: 'Activity', content: 'Recent activity feed.' },
    { key: 'settings', label: 'Settings', content: 'Account settings form.' },
  ];
  active = signal('overview');
  currentTab = computed(() => this.tabs.find(t => t.key === this.active())!);
}

// 33. Modal/dialog open state in URL (simulated signal)
@Component({
  selector: 'ex-33', standalone: true,
  template: `
    <p><strong>Modal open state encoded in queryParam:</strong></p>
    <div style="font-size:13px;position:relative">
      <button (click)="openModal('create-product')">Create Product</button>
      <button (click)="openModal('edit-product')" style="margin-left:8px">Edit Product</button>
      <p><code>{{ url() }}</code></p>
      @if (modal()) {
        <div style="position:absolute;top:0;right:0;background:#fff;border:2px solid #4299e1;padding:12px;min-width:160px;border-radius:4px">
          <strong>{{ modal() }}</strong>
          <p>Modal content here.</p>
          <button (click)="modal.set('')">Close</button>
        </div>
      }
    </div>
    <p style="color:#718096;font-size:11px">URL encodes modal state so back/forward closes/reopens it.</p>
  `
})
class Ex33 {
  modal = signal('');
  url   = computed(() => `/products${this.modal() ? `?modal=${this.modal()}` : ''}`);
  openModal(name: string) { this.modal.set(name); }
}

// 34. Bookmarkable search results page (signal state)
@Component({
  selector: 'ex-34', standalone: true,
  template: `
    <p><strong>Bookmarkable search results — full URL state:</strong></p>
    <div style="font-size:13px">
      <input [value]="query()" (input)="setQuery($event)" placeholder="Search..."
        style="padding:4px 8px;width:200px;margin-bottom:8px" />
      <div>
        @for (r of results(); track r) {
          <div style="padding:3px 0;border-bottom:1px solid #e2e8f0">{{ r }}</div>
        }
      </div>
      <div style="margin-top:6px;font-size:11px">
        Bookmark: <code>{{ bookmarkUrl() }}</code>
      </div>
    </div>
  `
})
class Ex34 {
  private allItems = ['Angular Router', 'React Router', 'Vue Router', 'Svelte routing', 'Query params guide'];
  query   = signal('');
  results = computed(() => {
    const q = this.query().toLowerCase();
    return q ? this.allItems.filter(i => i.toLowerCase().includes(q)) : this.allItems;
  });
  bookmarkUrl = computed(() => `/search${this.query() ? `?q=${encodeURIComponent(this.query())}` : ''}`);
  setQuery(e: Event) { this.query.set((e.target as HTMLInputElement).value); }
}

// 35. queryParam with history push/replace — code display
@Component({
  selector: 'ex-35', standalone: true,
  template: `
    <p><strong>history push vs replace with queryParams:</strong></p>
    <pre>
// PUSH (default) — new history entry (back button available):
router.navigate(['/products'], {{ '{' }}
  queryParams: {{ '{' }} sort: 'price' {{ '}' }},
  queryParamsHandling: 'merge'
// no replaceUrl → default false → pushes to history
{{ '}' }});

// REPLACE — no new history entry (back button skips this state):
router.navigate(['/products'], {{ '{' }}
  queryParams: {{ '{' }} sort: 'price' {{ '}' }},
  queryParamsHandling: 'merge',
  replaceUrl: true   // replaces current history entry
{{ '}' }});

// Guideline: use replaceUrl:true for filter/sort changes,
// push (default) for page navigation.</pre>
  `
})
class Ex35 {}

// 36. Deep link with complex queryParam object — code display
@Component({
  selector: 'ex-36', standalone: true,
  template: `
    <p><strong>Deep link with multiple queryParams shared via URL:</strong></p>
    <pre>
// Full deep link URL:
// /shop/products?category=electronics&brand=apple&minPrice=100&maxPrice=2000&sort=price&dir=asc&page=3&inStock=true

// Reading all at once with queryParamMap:
this.route.queryParamMap.subscribe(params => {{ '{' }}
  this.filters = {{ '{' }}
    category: params.get('category') ?? 'all',
    brand:    params.get('brand') ?? '',
    minPrice: parseInt(params.get('minPrice') ?? '0', 10),
    maxPrice: parseInt(params.get('maxPrice') ?? '9999', 10),
    sort:     params.get('sort') ?? 'name',
    dir:      params.get('dir') ?? 'asc',
    page:     parseInt(params.get('page') ?? '1', 10),
    inStock:  params.get('inStock') === 'true',
  {{ '}' }};
{{ '}' }});</pre>
  `
})
class Ex36 {}

// 37. QueryParam state with undo (signal history stack)
@Component({
  selector: 'ex-37', standalone: true,
  template: `
    <p><strong>QueryParam state with undo (history stack simulation):</strong></p>
    <div style="font-size:13px">
      <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap">
        @for (cat of categories; track cat) {
          <button (click)="applyFilter(cat)"
            [style.background]="current() === cat ? '#4299e1' : '#e2e8f0'"
            [style.color]="current() === cat ? '#fff' : '#4a5568'"
            style="padding:4px 10px;border:none;border-radius:4px;cursor:pointer">
            {{ cat }}
          </button>
        }
        <button (click)="undo()" [disabled]="historyStack().length <= 1">↩ Undo</button>
      </div>
      <code style="font-size:11px">?category={{ current() }}</code>
      <p style="color:#718096;font-size:11px">History depth: {{ historyStack().length }}</p>
    </div>
  `
})
class Ex37 {
  categories = ['all', 'shoes', 'bags', 'electronics'];
  historyStack = signal<string[]>(['all']);
  current = computed(() => this.historyStack()[this.historyStack().length - 1]);
  applyFilter(cat: string) {
    if (cat !== this.current()) this.historyStack.update(h => [...h, cat]);
  }
  undo() {
    if (this.historyStack().length > 1) this.historyStack.update(h => h.slice(0, -1));
  }
}

// 38. Full URL state management service (signal-based)
@Component({
  selector: 'ex-38', standalone: true,
  template: `
    <p><strong>URL state management service (signal-based simulation):</strong></p>
    <pre style="font-size:11px">
// url-state.service.ts
@Injectable({{ '{' }} providedIn: 'root' {{ '}' }})
class UrlStateService {{ '{' }}
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  // Convert queryParamMap observable to signal
  private params = toSignal(this.route.queryParamMap, {{ '{' }} initialValue: new Map() {{ '}' }});

  // Derived signals
  category = computed(() => this.params().get('category') ?? 'all');
  sort     = computed(() => this.params().get('sort') ?? 'name');
  page     = computed(() => parseInt(this.params().get('page') ?? '1', 10));

  update(patch: Record&lt;string, string | null&gt;) {{ '{' }}
    this.router.navigate([], {{ '{' }}
      relativeTo: this.route,
      queryParams: patch,
      queryParamsHandling: 'merge',
      replaceUrl: true
    {{ '}' }});
  {{ '}' }}
{{ '}' }}</pre>
  `
})
class Ex38 {}

// ─── ADVANCED (39–50) ────────────────────────────────────────

// 39. Custom queryParam serializer (array → CSV) — code display
@Component({
  selector: 'ex-39', standalone: true,
  template: `
    <p><strong>Custom queryParam serialization — array as CSV:</strong></p>
    <pre>
// Default Angular behavior: ?tag=a&tag=b&tag=c  (repeated key)
// Custom: ?tags=a,b,c  (comma-separated)

// Serialize before navigate:
const tags = ['angular', 'typescript', 'rxjs'];
router.navigate(['/posts'], {{ '{' }}
  queryParams: {{ '{' }} tags: tags.join(',') {{ '}' }}
{{ '}' }});
// URL: /posts?tags=angular,typescript,rxjs

// Deserialize on read:
this.route.queryParamMap.subscribe(p => {{ '{' }}
  const raw = p.get('tags') ?? '';
  this.tags = raw ? raw.split(',') : [];
{{ '}' }});</pre>
  `
})
class Ex39 {}

// 40. Object queryParam (JSON.stringify/parse) — code display
@Component({
  selector: 'ex-40', standalone: true,
  template: `
    <p><strong>Object encoded as JSON queryParam:</strong></p>
    <pre>
// Serialize complex filter object into URL:
const filters = {{ '{' }} category: 'shoes', minPrice: 50, maxPrice: 200, inStock: true {{ '}' }};
router.navigate(['/products'], {{ '{' }}
  queryParams: {{ '{' }} filters: JSON.stringify(filters) {{ '}' }}
{{ '}' }});
// URL: /products?filters=%7B"category":"shoes","minPrice":50,...%7D

// Deserialize:
this.route.queryParamMap.subscribe(p => {{ '{' }}
  try {{ '{' }}
    const raw = p.get('filters');
    this.filters = raw ? JSON.parse(decodeURIComponent(raw)) : defaultFilters;
  {{ '}' }} catch {{ '{' }}
    this.filters = defaultFilters;
  {{ '}' }}
{{ '}' }});

// ⚠️ Downsides: URL is ugly; use sparingly for complex state.</pre>
  `
})
class Ex40 {}

// 41. URL serializer customization — code display
@Component({
  selector: 'ex-41', standalone: true,
  template: `
    <p><strong>Custom UrlSerializer — control how URLs are parsed and serialized:</strong></p>
    <pre>
import {{ '{' }} UrlSerializer, DefaultUrlSerializer {{ '}' }} from '@angular/router';

@Injectable()
class CustomUrlSerializer extends DefaultUrlSerializer {{ '{' }}
  override parse(url: string): UrlTree {{ '{' }}
    // Custom parsing — e.g., convert + to %20 in queries
    return super.parse(url.replace(/\+/g, '%20'));
  {{ '}' }}

  override serialize(tree: UrlTree): string {{ '{' }}
    // Custom serialization — e.g., lowercase all param names
    return super.serialize(tree);
  {{ '}' }}
{{ '}' }}

// Register:
providers: [{{ '{' }} provide: UrlSerializer, useClass: CustomUrlSerializer {{ '}' }}]</pre>
  `
})
class Ex41 {}

// 42. QueryParam type coercion service
@Component({
  selector: 'ex-42', standalone: true,
  template: `
    <p><strong>QueryParam type coercion utility service:</strong></p>
    <div style="font-size:13px">
      <p>Simulated coercion from string queryParams:</p>
      <div style="background:#f7fafc;padding:8px;border-radius:4px">
        @for (example of coercions; track example.key) {
          <div style="display:flex;gap:8px;padding:3px 0;border-bottom:1px solid #e2e8f0">
            <code style="min-width:80px">{{ example.key }}</code>
            <span style="color:#718096">raw: "{{ example.raw }}"</span>
            <span>→ {{ example.type }}: <strong>{{ example.result }}</strong></span>
          </div>
        }
      </div>
    </div>
  `
})
class Ex42 {
  coercions = [
    { key: 'page',    raw: '3',     type: 'number',  result: '3' },
    { key: 'active',  raw: 'true',  type: 'boolean', result: 'true' },
    { key: 'price',   raw: '99.99', type: 'float',   result: '99.99' },
    { key: 'ids',     raw: '1,2,3', type: 'number[]',result: '[1,2,3]' },
    { key: 'name',    raw: 'alice', type: 'string',  result: 'alice' },
  ];
}

// 43. Matrix params concept (;key=value) — code display
@Component({
  selector: 'ex-43', standalone: true,
  template: `
    <p><strong>Matrix parameters (;key=value) — segment-local params:</strong></p>
    <pre>
// Matrix params are scoped to a URL segment (not global like queryParams):
// URL: /products;color=red;size=large/detail

// RouterLink:
&lt;a [routerLink]="['/products', {{ '{' }} color: 'red', size: 'large' {{ '}' }}, 'detail']"&gt;
  Red Large Products
&lt;/a&gt;

// Reading in component:
this.route.params.subscribe(p => {{ '{' }}
  console.log(p['color']); // 'red'
  console.log(p['size']);  // 'large'
{{ '}' }});

// Matrix params are unusual in Angular apps — prefer queryParams for most use cases.
// Main use: when passing params that logically belong to a specific path segment.</pre>
  `
})
class Ex43 {}

// 44. QueryParam history navigation — code display
@Component({
  selector: 'ex-44', standalone: true,
  template: `
    <p><strong>QueryParam state and browser history navigation:</strong></p>
    <pre>
// Each queryParam change creates a history entry (by default):
// History stack after filter changes:
// ['/products'] →
// ['/products?category=shoes'] →
// ['/products?category=shoes&sort=price'] →
// ['/products?category=shoes&sort=price&page=2']

// User pressing Back: goes to /products?category=shoes&sort=price
// Router fires NavigationEnd with restored queryParams

// To prevent history pollution for rapid filter changes:
router.navigate([], {{ '{' }}
  queryParams: {{ '{' }} category: 'shoes' {{ '}' }},
  queryParamsHandling: 'merge',
  replaceUrl: true  // replaces current entry — no Back entry
{{ '}' }});</pre>
  `
})
class Ex44 {}

// 45. QueryParam + signal store bidirectional sync
@Component({
  selector: 'ex-45', standalone: true,
  template: `
    <p><strong>Bidirectional sync: URL queryParams ↔ Signal store:</strong></p>
    <pre style="font-size:11px">
// Bidirectional sync service:
@Injectable({{ '{' }} providedIn: 'root' {{ '}' }})
class FilterSyncService {{ '{' }}
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  // Signal store state (source of truth for UI)
  filters = signal&lt;Filters&gt;(defaultFilters);

  constructor() {{ '{' }}
    // URL → Signal (on navigation)
    toSignal(this.route.queryParamMap, {{ '{' }} initialValue: emptyParamMap {{ '}' }});
    // When URL changes, update signal:
    effect(() => {{ '{' }}
      this.route.queryParamMap.subscribe(p => this.filters.set(parseFilters(p)));
    {{ '}' }});

    // Signal → URL (when filters change in UI)
    effect(() => {{ '{' }}
      const f = this.filters();
      this.router.navigate([], {{ '{' }}
        queryParams: serializeFilters(f),
        replaceUrl: true
      {{ '}' }});
    {{ '}' }});
  {{ '}' }}
{{ '}' }}</pre>
  `
})
class Ex45 {}

// 46. Route snapshot vs Observable queryParams tradeoff — code display
@Component({
  selector: 'ex-46', standalone: true,
  template: `
    <p><strong>Snapshot vs Observable queryParams — when to use each:</strong></p>
    <table style="border-collapse:collapse;font-size:12px;width:100%">
      <tr style="background:#edf2f7">
        <th style="padding:4px 8px;border:1px solid #cbd5e0">Approach</th>
        <th style="padding:4px 8px;border:1px solid #cbd5e0">Pros</th>
        <th style="padding:4px 8px;border:1px solid #cbd5e0">Cons</th>
      </tr>
      @for (row of rows; track row.approach) {
        <tr>
          <td style="padding:4px 8px;border:1px solid #cbd5e0;white-space:nowrap"><code>{{ row.approach }}</code></td>
          <td style="padding:4px 8px;border:1px solid #cbd5e0">{{ row.pros }}</td>
          <td style="padding:4px 8px;border:1px solid #cbd5e0">{{ row.cons }}</td>
        </tr>
      }
    </table>
  `
})
class Ex46 {
  rows = [
    { approach: 'snapshot.queryParamMap', pros: 'Simple, no subscription', cons: "Stale if component isn't destroyed on nav" },
    { approach: 'route.queryParamMap$', pros: 'Always up to date, reactive', cons: 'Requires subscribe/async pipe' },
    { approach: 'toSignal(queryParamMap)', pros: 'Signal-native, no subscribe', cons: 'Requires rxjs-interop import' },
    { approach: '@Input() (withComponentInputBinding)', pros: 'Cleanest syntax', cons: 'Requires global router config' },
  ];
}

// 47. QueryParam with replace vs push history — code display
@Component({
  selector: 'ex-47', standalone: true,
  template: `
    <p><strong>replaceUrl true/false decision guide:</strong></p>
    <pre>
// Use replaceUrl: true (no history entry) for:
//  - Filter/sort/search changes (typing in search box)
//  - Tab switches within the same page
//  - Pagination (debatable — depends on UX)

// Use replaceUrl: false (default, push to history) for:
//  - Moving between distinct pages (list → detail)
//  - Wizard step navigation
//  - Explicit "Apply" button on filter panel

// Example: auto-search while typing (replace, not push):
onSearchInput(q: string) {{ '{' }}
  this.router.navigate([], {{ '{' }}
    queryParams: {{ '{' }} q {{ '}' }},
    queryParamsHandling: 'merge',
    replaceUrl: true
  {{ '}' }});
{{ '}' }}</pre>
  `
})
class Ex47 {}

// 48. Complex queryParam encoding for nested objects — code display
@Component({
  selector: 'ex-48', standalone: true,
  template: `
    <p><strong>Strategies for encoding complex/nested state in queryParams:</strong></p>
    <pre>
// Strategy 1: Flat params (recommended for simple objects)
?minPrice=50&maxPrice=200&inStock=true

// Strategy 2: JSON-encoded single param
?filter=%7B"min":50,"max":200,"inStock":true%7D

// Strategy 3: Base64-encoded (for large/opaque state)
const encoded = btoa(JSON.stringify(state));
router.navigate(['/products'], {{ '{' }} queryParams: {{ '{' }} state: encoded {{ '}' }} {{ '}' }});
// Decode: JSON.parse(atob(route.snapshot.queryParamMap.get('state') ?? ''))

// Strategy 4: LZ-compressed (for very large state — use lz-string library)
const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(state));

// Recommendation: Strategy 1 for most use cases; base64 only for complex/opaque blobs.</pre>
  `
})
class Ex48 {}

// 49. QueryParam A/B test variant — code display
@Component({
  selector: 'ex-49', standalone: true,
  template: `
    <p><strong>A/B test variant via queryParam:</strong></p>
    <div style="font-size:13px">
      <p>Simulated A/B variant from URL <code>?variant=B</code>:</p>
      <div style="display:flex;gap:8px;margin-bottom:8px">
        @for (v of ['A', 'B', 'C']; track v) {
          <button (click)="variant.set(v)"
            [style.background]="variant() === v ? '#4299e1' : '#e2e8f0'"
            [style.color]="variant() === v ? '#fff' : '#4a5568'"
            style="padding:4px 12px;border:none;border-radius:4px;cursor:pointer">
            Variant {{ v }}
          </button>
        }
      </div>
      @if (variant() === 'A') { <div style="background:#f0fff4;padding:8px;border-radius:4px">🅰 Control: Standard layout</div> }
      @if (variant() === 'B') { <div style="background:#ebf8ff;padding:8px;border-radius:4px">🅱 Variant B: Hero image prominent</div> }
      @if (variant() === 'C') { <div style="background:#fef3c7;padding:8px;border-radius:4px">🅲 Variant C: Minimal design</div> }
      <p style="font-size:11px;color:#718096">URL: <code>/?variant={{ variant() }}</code></p>
    </div>
  `
})
class Ex49 {
  variant = signal('A');
}

// 50. Full URL state management: filter + sort + page + search (complete demo)
@Component({
  selector: 'ex-50', standalone: true,
  template: `
    <p><strong>Full URL state management — complete demo:</strong></p>
    <div style="font-size:13px">
      <div style="display:flex;gap:8px;flex-wrap:wrap;padding:8px;background:#f7fafc;border-radius:4px;margin-bottom:8px">
        <input [value]="q()" (input)="update('q', getVal($event))"
          placeholder="Search..." style="padding:3px 6px;width:120px" />
        <select (change)="update('cat', getVal($event))">
          @for (c of ['all','shoes','bags','electronics']; track c) {
            <option [value]="c" [selected]="cat() === c">{{ c }}</option>
          }
        </select>
        <select (change)="update('sort', getVal($event))">
          @for (s of ['name','price','date']; track s) {
            <option [value]="s" [selected]="sort() === s">Sort: {{ s }}</option>
          }
        </select>
        <button (click)="toggleDir()">{{ dir() === 'asc' ? '↑ Asc' : '↓ Desc' }}</button>
        <button (click)="prevPage()" [disabled]="page() === 1">‹</button>
        <span>Page {{ page() }}/{{ totalPages() }}</span>
        <button (click)="nextPage()" [disabled]="page() === totalPages()">›</button>
        <button (click)="reset()" style="margin-left:auto">Reset</button>
      </div>
      <div style="font-size:11px;margin-bottom:6px">
        <code>{{ url() }}</code>
      </div>
      <div>
        @for (item of pageItems(); track item) {
          <div style="padding:3px 6px;border-bottom:1px solid #e2e8f0">{{ item }}</div>
        }
      </div>
    </div>
  `
})
class Ex50 {
  private all = ['Angular Guide', 'React Tutorial', 'Vue Handbook', 'TypeScript Basics',
                 'RxJS Deep Dive', 'NgRx Patterns', 'CSS Tricks', 'Node.js API', 'GraphQL Intro', 'Docker Compose'];
  q    = signal('');
  cat  = signal('all');
  sort = signal('name');
  dir  = signal<'asc'|'desc'>('asc');
  page = signal(1);
  limit = 3;

  filtered = computed(() => {
    let items = this.all.filter(i => i.toLowerCase().includes(this.q().toLowerCase()));
    return items.sort((a, b) => this.dir() === 'asc' ? a.localeCompare(b) : b.localeCompare(a));
  });
  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.limit)));
  pageItems  = computed(() => this.filtered().slice((this.page() - 1) * this.limit, this.page() * this.limit));
  url = computed(() => {
    const p: string[] = [];
    if (this.q()) p.push(`q=${encodeURIComponent(this.q())}`);
    if (this.cat() !== 'all') p.push(`cat=${this.cat()}`);
    p.push(`sort=${this.sort()}`, `dir=${this.dir()}`, `page=${this.page()}`);
    return `/search?${p.join('&')}`;
  });

  update(key: string, val: string) {
    if (key === 'q')    { this.q.set(val);    this.page.set(1); }
    if (key === 'cat')  { this.cat.set(val);  this.page.set(1); }
    if (key === 'sort') { this.sort.set(val); this.page.set(1); }
  }
  toggleDir()  { this.dir.update(d => d === 'asc' ? 'desc' : 'asc'); this.page.set(1); }
  prevPage()   { this.page.update(p => Math.max(1, p - 1)); }
  nextPage()   { this.page.update(p => Math.min(this.totalPages(), p + 1)); }
  reset()      { this.q.set(''); this.cat.set('all'); this.sort.set('name'); this.dir.set('asc'); this.page.set(1); }
  getVal(e: Event) { return (e.target as HTMLInputElement | HTMLSelectElement).value; }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Ex01, Ex02, Ex03, Ex04, Ex05, Ex06, Ex07, Ex08, Ex09, Ex10,
            Ex11, Ex12, Ex13, Ex14, Ex15, Ex16, Ex17, Ex18, Ex19, Ex20,
            Ex21, Ex22, Ex23, Ex24, Ex25, Ex26, Ex27, Ex28, Ex29, Ex30,
            Ex31, Ex32, Ex33, Ex34, Ex35, Ex36, Ex37, Ex38, Ex39, Ex40,
            Ex41, Ex42, Ex43, Ex44, Ex45, Ex46, Ex47, Ex48, Ex49, Ex50],
  template: `
    <div style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:20px">
      <h1>Examples 4.5 — Query Params & Route Params</h1>
      <h4>1. queryParams concept</h4><ex-01 /><hr />
      <h4>2. RouterLink queryParams</h4><ex-02 /><hr />
      <h4>3. Read queryParams with signal</h4><ex-03 /><hr />
      <h4>4. Read route param (:id signal)</h4><ex-04 /><hr />
      <h4>5. Snapshot queryParams pattern</h4><ex-05 /><hr />
      <h4>6. queryParamsHandling: 'merge'</h4><ex-06 /><hr />
      <h4>7. queryParamsHandling: 'preserve'</h4><ex-07 /><hr />
      <h4>8. Fragment navigation</h4><ex-08 /><hr />
      <h4>9. Route params vs query params</h4><ex-09 /><hr />
      <h4>10. String queryParam display</h4><ex-10 /><hr />
      <h4>11. Number queryParam (parseInt signal)</h4><ex-11 /><hr />
      <h4>12. Boolean queryParam coerce</h4><ex-12 /><hr />
      <h4>13. Required vs optional params</h4><ex-13 /><hr />
      <h4>14. Multiple queryParams (filter + sort + page)</h4><ex-14 /><hr />
      <h4>15. Array queryParam (repeated key)</h4><ex-15 /><hr />
      <h4>16. queryParam-driven filter UI</h4><ex-16 /><hr />
      <h4>17. queryParam-driven sort toggle</h4><ex-17 /><hr />
      <h4>18. queryParam pagination</h4><ex-18 /><hr />
      <h4>19. Search queryParam with debounce</h4><ex-19 /><hr />
      <h4>20. Update queryParam without full navigation</h4><ex-20 /><hr />
      <h4>21. Remove queryParam (set to undefined)</h4><ex-21 /><hr />
      <h4>22. queryParam in resolver</h4><ex-22 /><hr />
      <h4>23. queryParam in guard</h4><ex-23 /><hr />
      <h4>24. Fragment + queryParams combined</h4><ex-24 /><hr />
      <h4>25. withComponentInputBinding queryParam as @Input</h4><ex-25 /><hr />
      <h4>26. toSignal(route.queryParamMap) pattern</h4><ex-26 /><hr />
      <h4>27. Full filter panel (category + status + price)</h4><ex-27 /><hr />
      <h4>28. Search + filter + sort all in URL</h4><ex-28 /><hr />
      <h4>29. Pagination component</h4><ex-29 /><hr />
      <h4>30. List page with all queryParam state</h4><ex-30 /><hr />
      <h4>31. Shareable URL state</h4><ex-31 /><hr />
      <h4>32. Tab selection via queryParam</h4><ex-32 /><hr />
      <h4>33. Modal open state in URL</h4><ex-33 /><hr />
      <h4>34. Bookmarkable search results page</h4><ex-34 /><hr />
      <h4>35. queryParam with history push/replace</h4><ex-35 /><hr />
      <h4>36. Deep link with complex queryParam object</h4><ex-36 /><hr />
      <h4>37. QueryParam state with undo</h4><ex-37 /><hr />
      <h4>38. Full URL state management service</h4><ex-38 /><hr />
      <h4>39. Custom queryParam serializer (array → CSV)</h4><ex-39 /><hr />
      <h4>40. Object queryParam (JSON.stringify/parse)</h4><ex-40 /><hr />
      <h4>41. URL serializer customization</h4><ex-41 /><hr />
      <h4>42. QueryParam type coercion service</h4><ex-42 /><hr />
      <h4>43. Matrix params concept (;key=value)</h4><ex-43 /><hr />
      <h4>44. QueryParam history navigation</h4><ex-44 /><hr />
      <h4>45. QueryParam + signal store bidirectional sync</h4><ex-45 /><hr />
      <h4>46. Route snapshot vs Observable queryParams tradeoff</h4><ex-46 /><hr />
      <h4>47. QueryParam with replace vs push history</h4><ex-47 /><hr />
      <h4>48. Complex queryParam encoding for nested objects</h4><ex-48 /><hr />
      <h4>49. QueryParam A/B test variant</h4><ex-49 /><hr />
      <h4>50. Full URL state management: filter + sort + page + search</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
