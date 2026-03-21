import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// ── Shared simulation helpers ──────────────────────────────────────────────
const simParams = signal<Record<string, string>>({ id: '42', category: 'books' });
const simQueryParams = signal<Record<string, string>>({ page: '1', sort: 'asc', q: '' });
const simFragment = signal<string>('section-1');

function setParam(key: string, value: string) {
  simParams.update(p => ({ ...p, [key]: value }));
}
function setQuery(key: string, value: string) {
  simQueryParams.update(q => ({ ...q, [key]: value }));
}
function removeQuery(key: string) {
  simQueryParams.update(q => { const c = { ...q }; delete c[key]; return c; });
}

// ── Ex01 – paramMap.get() ─────────────────────────────────────────────────
@Component({
  selector: 'ex-01', standalone: true, template: `
    <p>paramMap.get() reads a named route parameter.</p>
    <pre>const id = route.snapshot.paramMap.get('id');</pre>
    <p>Simulated :id param = <code>{{ id() }}</code></p>
    <button (click)="setParam('id', '99')">Set id=99</button>
  `
})
export class Ex01 {
  id = computed(() => simParams()['id'] ?? null);
  setParam = setParam;
}

// ── Ex02 – queryParamMap.get() ────────────────────────────────────────────
@Component({
  selector: 'ex-02', standalone: true, template: `
    <p>queryParamMap.get() reads a query parameter.</p>
    <pre>const page = route.snapshot.queryParamMap.get('page');</pre>
    <p>?page = <code>{{ page() }}</code></p>
    <button (click)="setQuery('page', '3')">Set page=3</button>
  `
})
export class Ex02 {
  page = computed(() => simQueryParams()['page'] ?? null);
  setQuery = setQuery;
}

// ── Ex03 – snapshot params (one-time read) ────────────────────────────────
@Component({
  selector: 'ex-03', standalone: true, template: `
    <p>snapshot.params gives a one-time read (does not update reactively).</p>
    <pre>// In ngOnInit:
const id = this.route.snapshot.params['id'];</pre>
    <p>Snapshot value (captured once): <code>{{ snapshotId }}</code></p>
    <p>Live value: <code>{{ liveId() }}</code></p>
    <button (click)="change()">Change :id param</button>
  `
})
export class Ex03 {
  snapshotId = simParams()['id']; // captured once
  liveId = computed(() => simParams()['id']);
  change() { setParam('id', String(Math.floor(Math.random() * 100))); }
}

// ── Ex04 – params Observable (live updates) ───────────────────────────────
@Component({
  selector: 'ex-04', standalone: true, template: `
    <p>route.params is an Observable — subscribe for live updates (same component reuse).</p>
    <pre>this.route.params.subscribe(p => this.id.set(p['id']));</pre>
    <p>Live :id = <code>{{ id() }}</code></p>
    <button (click)="change()">Change :id (simulates params$ emit)</button>
  `
})
export class Ex04 {
  id = computed(() => simParams()['id']);
  change() { setParam('id', String(+simParams()['id'] + 1)); }
}

// ── Ex05 – queryParams Observable ─────────────────────────────────────────
@Component({
  selector: 'ex-05', standalone: true, template: `
    <p>route.queryParams Observable streams query param changes.</p>
    <pre>this.route.queryParams.subscribe(qp => this.page.set(qp['page']));</pre>
    <p>Live ?page = <code>{{ page() }}</code></p>
    <button (click)="next()">page++</button>
  `
})
export class Ex05 {
  page = computed(() => +(simQueryParams()['page'] ?? 1));
  next() { setQuery('page', String(this.page() + 1)); }
}

// ── Ex06 – toSignal(route.paramMap) ───────────────────────────────────────
@Component({
  selector: 'ex-06', standalone: true, template: `
    <p>toSignal() converts route.paramMap Observable to a signal.</p>
    <pre>const params = toSignal(inject(ActivatedRoute).paramMap);
const id = computed(() => params()?.get('id'));</pre>
    <p>Simulated signal value: <code>{{ id() }}</code></p>
  `
})
export class Ex06 {
  id = computed(() => simParams()['id']);
}

// ── Ex07 – withComponentInputBinding @Input param ─────────────────────────
@Component({
  selector: 'ex-07', standalone: true, template: `
    <p>With withComponentInputBinding(), route params bind to @Input() automatically.</p>
    <pre>// In route: { path: 'products/:id', component: ProductComponent }
// In component (no ActivatedRoute needed):
@Input() id!: string;</pre>
    <p>Bound id (simulated): <code>{{ id() }}</code></p>
  `
})
export class Ex07 {
  id = computed(() => simParams()['id']);
}

// ── Ex08 – queryParam single ──────────────────────────────────────────────
@Component({
  selector: 'ex-08', standalone: true, template: `
    <p>Reading a single query param.</p>
    <pre>const sort = route.snapshot.queryParamMap.get('sort');</pre>
    <p>?sort = <code>{{ sort() }}</code></p>
    <button (click)="toggle()">Toggle sort</button>
  `
})
export class Ex08 {
  sort = computed(() => simQueryParams()['sort'] ?? 'asc');
  toggle() { setQuery('sort', this.sort() === 'asc' ? 'desc' : 'asc'); }
}

// ── Ex09 – queryParam multiple values (getAll) ────────────────────────────
@Component({
  selector: 'ex-09', standalone: true, template: `
    <p>queryParamMap.getAll() returns array for repeated params: ?tag=a&tag=b</p>
    <pre>const tags = route.snapshot.queryParamMap.getAll('tag');
// → ['angular', 'rxjs']</pre>
    <p>Simulated tags: <code>{{ tags().join(', ') }}</code></p>
    <button (click)="add()">Add tag</button>
  `
})
export class Ex09 {
  tagList = signal(['angular', 'rxjs']);
  tags = this.tagList;
  add() { this.tagList.update(t => [...t, 'signals']); }
}

// ── Ex10 – queryParam boolean coerce ─────────────────────────────────────
@Component({
  selector: 'ex-10', standalone: true, template: `
    <p>Coerce query param string to boolean.</p>
    <pre>const debug = route.snapshot.queryParamMap.get('debug') === 'true';</pre>
    <p>?debug = <code>{{ debugStr() }}</code> → boolean: <code>{{ debugBool() }}</code></p>
    <button (click)="toggle()">Toggle</button>
  `
})
export class Ex10 {
  debugStr = signal('false');
  debugBool = computed(() => this.debugStr() === 'true');
  toggle() { this.debugStr.update(v => v === 'true' ? 'false' : 'true'); }
}

// ── Ex11 – queryParam number coerce ──────────────────────────────────────
@Component({
  selector: 'ex-11', standalone: true, template: `
    <p>Coerce query param string to number.</p>
    <pre>const page = Number(route.snapshot.queryParamMap.get('page') ?? '1');</pre>
    <p>?page string: <code>{{ pageStr() }}</code> → number: <code>{{ pageNum() }}</code></p>
    <input type="number" [value]="pageNum()"
      (input)="pageStr.set($any($event.target).value)">
  `
})
export class Ex11 {
  pageStr = signal('1');
  pageNum = computed(() => Number(this.pageStr()) || 1);
}

// ── Ex12 – queryParam array (comma-separated) ─────────────────────────────
@Component({
  selector: 'ex-12', standalone: true, template: `
    <p>Encode arrays as comma-separated query params.</p>
    <pre>// URL: /items?ids=1,2,3
const ids = route.snapshot.queryParamMap.get('ids')?.split(',') ?? [];</pre>
    <p>?ids = <code>{{ raw() }}</code> → array: <code>{{ arr() | json }}</code></p>
    <button (click)="add()">Add ID</button>
  `, imports: [CommonModule]
})
export class Ex12 {
  raw = signal('1,2,3');
  arr = computed(() => this.raw().split(',').map(Number));
  add() {
    const next = (this.arr()[this.arr().length - 1] ?? 0) + 1;
    this.raw.update(r => r + ',' + next);
  }
}

// ── Ex13 – queryParam as filter state ─────────────────────────────────────
@Component({
  selector: 'ex-13', standalone: true, template: `
    <p>Use query params to represent filter state (shareable/bookmarkable URL).</p>
    <pre>// URL: /products?category=books&minPrice=10&maxPrice=50
// Navigate to apply filter:</pre>
    <p>Filter: category=<code>{{ cat() }}</code> price={{ '{' }}<code>{{ min() }}</code>,<code>{{ max() }}</code>{{ '}' }}</p>
    <button (click)="apply()">Apply filter</button>
  `
})
export class Ex13 {
  cat = signal('books');
  min = signal('10');
  max = signal('50');
  apply() { this.cat.set('electronics'); this.min.set('100'); this.max.set('500'); }
}

// ── Ex14 – queryParam pagination ─────────────────────────────────────────
@Component({
  selector: 'ex-14', standalone: true, template: `
    <p>Pagination via query params: ?page=2&limit=20</p>
    <p>Page: {{ page() }} / {{ totalPages() }} | Limit: {{ limit() }}</p>
    <button (click)="prev()" [disabled]="page() <= 1">Prev</button>
    <button (click)="next()" [disabled]="page() >= totalPages()">Next</button>
  `
})
export class Ex14 {
  page = signal(1);
  limit = signal(10);
  totalPages = signal(5);
  prev() { this.page.update(p => Math.max(1, p - 1)); }
  next() { this.page.update(p => Math.min(this.totalPages(), p + 1)); }
}

// ── Ex15 – queryParam sorting ─────────────────────────────────────────────
@Component({
  selector: 'ex-15', standalone: true, template: `
    <p>Sorting via query params: ?sortBy=name&sortDir=asc</p>
    <p>Sort: <code>{{ sortBy() }}</code> <code>{{ sortDir() }}</code></p>
    <button (click)="sort('name')">Sort by Name</button>
    <button (click)="sort('date')">Sort by Date</button>
    <button (click)="toggleDir()">Toggle Direction</button>
  `
})
export class Ex15 {
  sortBy = signal('name');
  sortDir = signal<'asc' | 'desc'>('asc');
  sort(field: string) { this.sortBy.set(field); }
  toggleDir() { this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc'); }
}

// ── Ex16 – queryParam search ──────────────────────────────────────────────
@Component({
  selector: 'ex-16', standalone: true, template: `
    <p>Search via query param: ?q=angular</p>
    <input [value]="q()" (input)="q.set($any($event.target).value)" placeholder="search...">
    <p>URL would be: <code>/search?q={{ q() }}</code></p>
    <p>Results for "{{ q() }}": (simulated {{ resultCount() }} items)</p>
  `
})
export class Ex16 {
  q = signal('angular');
  resultCount = computed(() => Math.max(0, 10 - this.q().length));
}

// ── Ex17 – update queryParam without full navigate ─────────────────────────
@Component({
  selector: 'ex-17', standalone: true, template: `
    <p>Update only one query param, preserving others.</p>
    <pre>router.navigate([], {{ '{' }}
  relativeTo: this.route,
  queryParams: {{ '{' }} page: newPage {{ '}' }},
  queryParamsHandling: 'merge'
{{ '}' }});</pre>
    <p>Params: <code>{{ params() | json }}</code></p>
    <button (click)="changePage()">Next Page (merge)</button>
  `, imports: [CommonModule]
})
export class Ex17 {
  params = signal({ page: '1', sort: 'asc', q: 'angular' });
  changePage() {
    this.params.update(p => ({ ...p, page: String(+p['page'] + 1) }));
  }
}

// ── Ex18 – merge queryParams ──────────────────────────────────────────────
@Component({
  selector: 'ex-18', standalone: true, template: `
    <p>queryParamsHandling: 'merge' adds/updates params without removing existing ones.</p>
    <pre>// Before: ?page=2&sort=asc
// After merge {{ '{' }} filter: 'active' {{ '}' }}: ?page=2&sort=asc&filter=active</pre>
    <p>Current params: <code>{{ params() | json }}</code></p>
    <button (click)="merge()">Merge {{ '{' }}filter: 'active'{{ '}' }}</button>
  `, imports: [CommonModule]
})
export class Ex18 {
  params = signal<Record<string, string>>({ page: '2', sort: 'asc' });
  merge() { this.params.update(p => ({ ...p, filter: 'active' })); }
}

// ── Ex19 – preserve queryParams ───────────────────────────────────────────
@Component({
  selector: 'ex-19', standalone: true, template: `
    <p>queryParamsHandling: 'preserve' keeps existing params unchanged.</p>
    <pre>router.navigate(['/new-page'], {{ '{' }}
  queryParamsHandling: 'preserve'
{{ '}' }});</pre>
    <p>Preserved params: <code>{{ params() | json }}</code></p>
  `, imports: [CommonModule]
})
export class Ex19 {
  params = signal({ page: '3', sort: 'desc', filter: 'active' });
}

// ── Ex20 – remove queryParam ──────────────────────────────────────────────
@Component({
  selector: 'ex-20', standalone: true, template: `
    <p>Remove a query param by setting it to null or undefined.</p>
    <pre>router.navigate([], {{ '{' }}
  queryParams: {{ '{' }} filter: null {{ '}' }},
  queryParamsHandling: 'merge'
{{ '}' }});</pre>
    <p>Params: <code>{{ params() | json }}</code></p>
    <button (click)="remove()">Remove 'filter'</button>
  `, imports: [CommonModule]
})
export class Ex20 {
  params = signal<Record<string, string>>({ page: '1', sort: 'asc', filter: 'active' });
  remove() {
    this.params.update(p => { const c = { ...p }; delete c['filter']; return c; });
  }
}

// ── Ex21 – queryParam in service ──────────────────────────────────────────
@Component({
  selector: 'ex-21', standalone: true, template: `
    <p>Centralise query param logic in a service.</p>
    <pre>@Injectable({ providedIn: 'root' })
export class FilterService {{ '{' }}
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  getFilter() {{ '{' }}
    return toSignal(this.route.queryParamMap.pipe(
      map(qp => qp.get('filter') ?? 'all')
    ));
  {{ '}' }}
  setFilter(value: string) {{ '{' }}
    this.router.navigate([], {{ '{' }} queryParams: {{ '{' }} filter: value {{ '}' }},
      queryParamsHandling: 'merge' {{ '}' }});
  {{ '}' }}
{{ '}' }}</pre>
  `
})
export class Ex21 {}

// ── Ex22 – queryParam URL state management ────────────────────────────────
@Component({
  selector: 'ex-22', standalone: true, template: `
    <p>Full URL state: page, sort, filter, search all in query params.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <label>Search: <input [value]="state().q" (input)="update('q', $any($event.target).value)"></label>
      <label>Page: <input type="number" [value]="state().page" (input)="update('page', $any($event.target).value)" style="width:50px"></label>
      <button (click)="update('sort', state().sort === 'asc' ? 'desc' : 'asc')">Sort: {{ state().sort }}</button>
    </div>
    <p>URL: <code>/items?q={{ state().q }}&page={{ state().page }}&sort={{ state().sort }}</code></p>
  `
})
export class Ex22 {
  state = signal({ q: 'angular', page: '1', sort: 'asc' });
  update(key: string, val: string) {
    this.state.update(s => ({ ...s, [key]: val }));
  }
}

// ── Ex23 – fragment param ─────────────────────────────────────────────────
@Component({
  selector: 'ex-23', standalone: true, template: `
    <p>Fragments (#section) scroll to page anchors.</p>
    <pre>const fragment = route.snapshot.fragment;
// or:
route.fragment.subscribe(f => this.anchor.set(f));</pre>
    <p>Current fragment: <code>#{{ fragment() }}</code></p>
    <button (click)="fragment.set('introduction')">Go to #introduction</button>
    <button (click)="fragment.set('api')">Go to #api</button>
  `
})
export class Ex23 { fragment = simFragment; }

// ── Ex24 – ActivatedRouteSnapshot ─────────────────────────────────────────
@Component({
  selector: 'ex-24', standalone: true, template: `
    <p>ActivatedRouteSnapshot is a one-time snapshot of the activated route.</p>
    <pre>const snap = inject(ActivatedRoute).snapshot;
snap.params      // route params
snap.queryParams // query params
snap.data        // static + resolved data
snap.url         // URL segments array
snap.fragment    // hash fragment</pre>
  `
})
export class Ex24 {}

// ── Ex25 – RouterStateSnapshot ────────────────────────────────────────────
@Component({
  selector: 'ex-25', standalone: true, template: `
    <p>RouterStateSnapshot captures the full router state tree at a moment in time.</p>
    <pre>// Used in guards:
export const myGuard: CanActivateFn =
  (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {{ '{' }}
    console.log('Navigating to:', state.url);
    return true;
  {{ '}' }};</pre>
  `
})
export class Ex25 {}

// ── Ex26 – parent route params access ─────────────────────────────────────
@Component({
  selector: 'ex-26', standalone: true, template: `
    <p>Access parent route params from a child component.</p>
    <pre>// Child component:
const parentId = inject(ActivatedRoute).parent?.snapshot.params['id'];

// Or reactively:
inject(ActivatedRoute).parent!.params
  .subscribe(p => this.parentId.set(p['id']));</pre>
    <p>Parent :id (simulated): <code>{{ parentId() }}</code></p>
  `
})
export class Ex26 {
  parentId = computed(() => simParams()['id']);
}

// ── Ex27 – child route inheriting params ──────────────────────────────────
@Component({
  selector: 'ex-27', standalone: true, template: `
    <p>With paramsInheritanceStrategy: 'always', child routes inherit parent params.</p>
    <pre>provideRouter(routes, withRouterConfig({{ '{' }}
  paramsInheritanceStrategy: 'always'
{{ '}' }}))

// Child can then read parent's :id directly:
const id = inject(ActivatedRoute).snapshot.params['id'];</pre>
  `
})
export class Ex27 {}

// ── Ex28 – paramMap.get vs .getAll ────────────────────────────────────────
@Component({
  selector: 'ex-28', standalone: true, template: `
    <p>paramMap.get() returns first value; .getAll() returns all values.</p>
    <pre>const single = paramMap.get('id');      // '42'
const all    = paramMap.getAll('tag');  // ['a', 'b', 'c']
const keys   = paramMap.keys;           // ['id', 'tag']
const has    = paramMap.has('id');      // true</pre>
  `
})
export class Ex28 {}

// ── Ex29 – params in resolver ─────────────────────────────────────────────
@Component({
  selector: 'ex-29', standalone: true, template: `
    <p>Resolvers use route params to pre-fetch data before navigation.</p>
    <pre>export const productResolver: ResolveFn&lt;Product&gt; = (route) => {{ '{' }}
  const id = route.paramMap.get('id')!;
  return inject(ProductService).getById(+id);
{{ '}' }};</pre>
  `
})
export class Ex29 {}

// ── Ex30 – params in guard ────────────────────────────────────────────────
@Component({
  selector: 'ex-30', standalone: true, template: `
    <p>Guards can read route params to make access decisions.</p>
    <pre>export const ownerGuard: CanActivateFn = (route) => {{ '{' }}
  const resourceId = route.paramMap.get('id')!;
  const userId = inject(AuthService).userId();
  return inject(ResourceService)
    .isOwner(resourceId, userId)
    .pipe(map(ok => ok || inject(Router).createUrlTree(['/403'])));
{{ '}' }};</pre>
  `
})
export class Ex30 {}

// ── Ex31 – dynamic breadcrumb from params ─────────────────────────────────
@Component({
  selector: 'ex-31', standalone: true, template: `
    <p>Build dynamic breadcrumbs by reading route params and data.</p>
    <p>Breadcrumb: <code>{{ breadcrumb() }}</code></p>
    <button (click)="setParam('id', '7')">Go to product 7</button>
  `
})
export class Ex31 {
  productId = computed(() => simParams()['id']);
  breadcrumb = computed(() => `Home > Products > Product #${this.productId()}`);
}

// ── Ex32 – ActivatedRoute data (static) ───────────────────────────────────
@Component({
  selector: 'ex-32', standalone: true, template: `
    <p>Static data defined in route config, accessed via ActivatedRoute.</p>
    <pre>// Route config:
{{ '{' }} path: 'admin', component: AdminComponent,
  data: {{ '{' }} role: 'admin', breadcrumb: 'Admin' {{ '}' }} {{ '}' }}

// Component:
const data = inject(ActivatedRoute).snapshot.data;
// data['role'] → 'admin'</pre>
  `
})
export class Ex32 {}

// ── Ex33 – ActivatedRoute data (resolved) ────────────────────────────────
@Component({
  selector: 'ex-33', standalone: true, template: `
    <p>Resolved data is merged into route.data after resolver completes.</p>
    <pre>// Route:
resolve: {{ '{' }} user: userResolver {{ '}' }}

// Component:
route.data.subscribe(d => this.user.set(d['user']));
// or snapshot:
const user = route.snapshot.data['user'] as User;</pre>
    <p>Resolved user (simulated): <code>{{ '{' }} id: 42, name: 'Alice' {{ '}' }}</code></p>
  `
})
export class Ex33 {}

// ── Ex34 – URL serializer concept ─────────────────────────────────────────
@Component({
  selector: 'ex-34', standalone: true, template: `
    <p>Custom UrlSerializer controls how URLs are parsed and serialized.</p>
    <pre>// Provide custom serializer:
{{ '{' }} provide: UrlSerializer, useClass: MyUrlSerializer {{ '}' }}

// Use case: support semicolons, custom encoding, matrix params
class MyUrlSerializer extends DefaultUrlSerializer {{ '{' }}
  override parse(url: string) {{ '{' }}
    return super.parse(url.toLowerCase()); // e.g. normalise case
  {{ '}' }}
{{ '}' }}</pre>
  `
})
export class Ex34 {}

// ── Ex35 – URL matching (custom matcher) ──────────────────────────────────
@Component({
  selector: 'ex-35', standalone: true, template: `
    <p>Custom URL matchers handle complex URL patterns.</p>
    <pre>export function userMatcher(segments: UrlSegment[]): UrlMatchResult | null {{ '{' }}
  if (segments.length === 1 && /^@/.test(segments[0].path)) {{ '{' }}
    return {{ '{' }} consumed: segments,
      posParams: {{ '{' }} handle: segments[0] {{ '}' }} {{ '}' }};
  {{ '}' }}
  return null;
{{ '}' }}

{{ '{' }} matcher: userMatcher, component: ProfileComponent {{ '}' }}
// Matches /@alice, /@bob etc.</pre>
  `
})
export class Ex35 {}

// ── Ex36 – matrix params concept ──────────────────────────────────────────
@Component({
  selector: 'ex-36', standalone: true, template: `
    <p>Matrix params use semicolons to pass params per URL segment.</p>
    <pre>// URL: /users;role=admin/posts;status=published
[routerLink]="['/users', {{ '{' }}role: 'admin'{{ '}' }}, 'posts', {{ '{' }}status: 'published'{{ '}' }}]"

// Read:
const role = route.snapshot.params['role'];   // 'admin'</pre>
    <p>Simulated matrix URL: <code>/users;role=admin/posts;status=published</code></p>
  `
})
export class Ex36 {}

// ── Ex37 – full URL state management pattern ──────────────────────────────
@Component({
  selector: 'ex-37', standalone: true, template: `
    <p>Complete URL-as-state management: all UI state lives in the URL.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <label>Search: <input [value]="ui().search" (input)="set('search', $any($event.target).value)"></label>
      <button (click)="set('page', String(+ui().page + 1))">Page {{ ui().page }} →</button>
      <button (click)="toggleSort()">Sort: {{ ui().sort }}</button>
      <button (click)="set('filter', ui().filter === 'all' ? 'active' : 'all')">Filter: {{ ui().filter }}</button>
    </div>
    <p>URL: <code>/items?search={{ ui().search }}&page={{ ui().page }}&sort={{ ui().sort }}&filter={{ ui().filter }}</code></p>
    <p>Shareable, bookmarkable, back-button friendly!</p>
  `
})
export class Ex37 {
  ui = signal({ search: '', page: '1', sort: 'asc', filter: 'all' });
  set(key: string, val: string) { this.ui.update(u => ({ ...u, [key]: val })); }
  toggleSort() { this.set('sort', this.ui().sort === 'asc' ? 'desc' : 'asc'); }
}

// ── Ex38 – paramMap has() ─────────────────────────────────────────────────
@Component({
  selector: 'ex-38', standalone: true, template: `
    <p>paramMap.has() checks if a parameter exists in the route.</p>
    <pre>const hasId = route.snapshot.paramMap.has('id');
const hasSlug = route.snapshot.paramMap.has('slug');</pre>
    <p>has 'id': <code>{{ hasId() }}</code> | has 'slug': <code>{{ hasSlug() }}</code></p>
    <button (click)="addSlug()">Add :slug param</button>
    <button (click)="removeSlug()">Remove :slug param</button>
  `
})
export class Ex38 {
  hasId = computed(() => 'id' in simParams());
  hasSlug = computed(() => 'slug' in simParams());
  addSlug() { setParam('slug', 'my-article'); }
  removeSlug() { simParams.update(p => { const c = { ...p }; delete c['slug']; return c; }); }
}

// ── Ex39 – queryParam keys() ──────────────────────────────────────────────
@Component({
  selector: 'ex-39', standalone: true, template: `
    <p>queryParamMap.keys returns all query param names.</p>
    <pre>const keys = route.snapshot.queryParamMap.keys;
// → ['page', 'sort', 'q']</pre>
    <p>Current keys: <code>{{ keys() | json }}</code></p>
  `, imports: [CommonModule]
})
export class Ex39 {
  keys = computed(() => Object.keys(simQueryParams()));
}

// ── Ex40 – Optional route params ──────────────────────────────────────────
@Component({
  selector: 'ex-40', standalone: true, template: `
    <p>Handle optional params gracefully using nullish coalescing.</p>
    <pre>const lang = route.snapshot.paramMap.get('lang') ?? 'en';
const tab  = route.snapshot.queryParamMap.get('tab') ?? 'overview';</pre>
    <p>lang: <code>{{ lang() }}</code> | tab: <code>{{ tab() }}</code></p>
  `
})
export class Ex40 {
  lang = computed(() => simParams()['lang'] ?? 'en');
  tab = computed(() => simQueryParams()['tab'] ?? 'overview');
}

// ── Ex41 – params type coercion helper ────────────────────────────────────
@Component({
  selector: 'ex-41', standalone: true, template: `
    <p>Helper to safely coerce typed params.</p>
    <pre>function getNum(route: ActivatedRoute, key: string, def = 0): number {{ '{' }}
  return +(route.snapshot.paramMap.get(key) ?? def) || def;
{{ '}' }}
function getBool(route: ActivatedRoute, key: string): boolean {{ '{' }}
  return route.snapshot.queryParamMap.get(key) === 'true';
{{ '}' }}</pre>
    <p>Coerced id: <code>{{ numId() }}</code></p>
  `
})
export class Ex41 {
  numId = computed(() => +(simParams()['id'] ?? '0') || 0);
}

// ── Ex42 – Multiple params on a route ────────────────────────────────────
@Component({
  selector: 'ex-42', standalone: true, template: `
    <p>A route can have multiple dynamic segments.</p>
    <pre>// Route: /users/:userId/posts/:postId/comments/:commentId
const userId    = route.snapshot.params['userId'];
const postId    = route.snapshot.params['postId'];
const commentId = route.snapshot.params['commentId'];</pre>
    <p>Simulated: user={{ userId() }} post={{ postId() }}</p>
  `
})
export class Ex42 {
  userId = signal('5');
  postId = signal('12');
}

// ── Ex43 – params change detection with same component ────────────────────
@Component({
  selector: 'ex-43', standalone: true, template: `
    <p>When navigating to same component with different params, Angular reuses it.</p>
    <pre>// Subscribe to params$ (not snapshot!) to react to changes:
this.route.params.subscribe(params => this.loadData(params['id']));</pre>
    <p>Current id: <code>{{ id() }}</code></p>
    <button (click)="change()">Simulate same-component param change</button>
  `
})
export class Ex43 {
  id = computed(() => simParams()['id']);
  change() { setParam('id', String(+simParams()['id'] + 1)); }
}

// ── Ex44 – queryParamMap in template ─────────────────────────────────────
@Component({
  selector: 'ex-44', standalone: true, template: `
    <p>Expose query params as a signal for direct template use.</p>
    <pre>// In component:
private route = inject(ActivatedRoute);
params = toSignal(this.route.queryParams, {{ '{' }} initialValue: {{ '{' }}{{ '}' }} {{ '}' }});</pre>
    <p>All query params: <code>{{ all() | json }}</code></p>
  `, imports: [CommonModule]
})
export class Ex44 {
  all = simQueryParams;
}

// ── Ex45 – Route with optional segment ────────────────────────────────────
@Component({
  selector: 'ex-45', standalone: true, template: `
    <p>Simulate optional segments using multiple route definitions.</p>
    <pre>// Two routes to simulate optional :tab:
{{ '{' }} path: 'profile/:id/:tab', component: ProfileComponent {{ '}' }},
{{ '{' }} path: 'profile/:id',      component: ProfileComponent {{ '}' }},

// In component:
const tab = route.snapshot.paramMap.get('tab') ?? 'overview';</pre>
    <p>Active tab: <code>{{ tab() }}</code></p>
    <button (click)="tab.set('overview')">Overview</button>
    <button (click)="tab.set('settings')">Settings</button>
    <button (click)="tab.set('activity')">Activity</button>
  `
})
export class Ex45 {
  tab = signal('overview');
}

// ── Ex46 – queryParam as enum ─────────────────────────────────────────────
@Component({
  selector: 'ex-46', standalone: true, template: `
    <p>Validate query params against an enum/union type.</p>
    <pre>type View = 'grid' | 'list' | 'map';
const VALID_VIEWS: View[] = ['grid', 'list', 'map'];

const rawView = route.snapshot.queryParamMap.get('view') ?? 'grid';
const view = (VALID_VIEWS.includes(rawView as View) ? rawView : 'grid') as View;</pre>
    <p>View: <code>{{ view() }}</code></p>
    <button (click)="view.set('grid')">Grid</button>
    <button (click)="view.set('list')">List</button>
    <button (click)="view.set('map')">Map</button>
  `
})
export class Ex46 {
  view = signal<'grid' | 'list' | 'map'>('grid');
}

// ── Ex47 – Combine route params + query params ────────────────────────────
@Component({
  selector: 'ex-47', standalone: true, template: `
    <p>Combine route params and query params using combineLatest or computed.</p>
    <pre>// Reactive approach:
combineLatest([route.params, route.queryParams])
  .subscribe(([params, queryParams]) => {{ '{' }}
    this.userId.set(params['id']);
    this.page.set(+(queryParams['page'] ?? 1));
  {{ '}' }});</pre>
    <p>userId: <code>{{ userId() }}</code> | page: <code>{{ page() }}</code></p>
  `
})
export class Ex47 {
  userId = computed(() => simParams()['id']);
  page = computed(() => +(simQueryParams()['page'] ?? 1));
}

// ── Ex48 – Deep link reconstruction ───────────────────────────────────────
@Component({
  selector: 'ex-48', standalone: true, template: `
    <p>Reconstruct a full deep-link URL from component state (for sharing).</p>
    <p>Shareable URL: <code>{{ deepLink() }}</code></p>
    <button (click)="category.set('electronics')">Electronics</button>
    <button (click)="sort.set('desc')">Sort Desc</button>
    <button (click)="page.update(n => n + 1)">Next Page</button>
  `
})
export class Ex48 {
  category = signal('books');
  sort = signal('asc');
  page = signal(1);
  deepLink = computed(() =>
    `/shop/${this.category()}?sort=${this.sort()}&page=${this.page()}`
  );
}

// ── Ex49 – ParamMap vs params snapshot ────────────────────────────────────
@Component({
  selector: 'ex-49', standalone: true, template: `
    <p>Difference between params (plain object) and paramMap (map API).</p>
    <pre>// params: plain object — direct property access
const id = route.snapshot.params['id'];

// paramMap: ParamMap object — safer API
const id2 = route.snapshot.paramMap.get('id');
const all  = route.snapshot.paramMap.keys;
const has  = route.snapshot.paramMap.has('id');
const arr  = route.snapshot.paramMap.getAll('tag');</pre>
  `
})
export class Ex49 {}

// ── Ex50 – Full param-driven component demo ───────────────────────────────
@Component({
  selector: 'ex-50', standalone: true, imports: [CommonModule], template: `
    <p>Fully param-driven product listing with search, sort, and pagination.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
      <input [value]="search()" (input)="search.set($any($event.target).value)" placeholder="Search...">
      <button (click)="toggleSort()">Sort: {{ sort() }}</button>
      <button (click)="page.update(n => Math.max(1, n - 1))">Prev</button>
      <span>Page {{ page() }}</span>
      <button (click)="page.update(n => n + 1)">Next</button>
    </div>
    <ul>
      @for (item of visibleItems(); track item) {
        <li>{{ item }}</li>
      }
    </ul>
    <p><em>URL: /products?q={{ search() }}&sort={{ sort() }}&page={{ page() }}</em></p>
  `
})
export class Ex50 {
  search = signal('');
  sort = signal<'asc' | 'desc'>('asc');
  page = signal(1);
  allItems = ['Angular Guide', 'RxJS Book', 'TypeScript Deep Dive', 'NgRx Patterns', 'Signals Handbook', 'Testing Angular'];
  filteredItems = computed(() =>
    this.allItems
      .filter(i => i.toLowerCase().includes(this.search().toLowerCase()))
      .sort((a, b) => this.sort() === 'asc' ? a.localeCompare(b) : b.localeCompare(a))
  );
  visibleItems = computed(() =>
    this.filteredItems().slice((this.page() - 1) * 3, this.page() * 3)
  );
  toggleSort() { this.sort.update(s => s === 'asc' ? 'desc' : 'asc'); }
}

// ── AppComponent ──────────────────────────────────────────────────────────
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
    <div style="font-family:sans-serif;max-width:860px;margin:0 auto;padding:20px">
      <h1>Phase 6 – Route Params & Query Params Examples</h1>

      <h4>Ex01 – paramMap.get()</h4><ex-01 /><hr />
      <h4>Ex02 – queryParamMap.get()</h4><ex-02 /><hr />
      <h4>Ex03 – snapshot params (one-time read)</h4><ex-03 /><hr />
      <h4>Ex04 – params Observable (live updates)</h4><ex-04 /><hr />
      <h4>Ex05 – queryParams Observable</h4><ex-05 /><hr />
      <h4>Ex06 – toSignal(route.paramMap)</h4><ex-06 /><hr />
      <h4>Ex07 – withComponentInputBinding @Input param</h4><ex-07 /><hr />
      <h4>Ex08 – queryParam single</h4><ex-08 /><hr />
      <h4>Ex09 – queryParam multiple (getAll)</h4><ex-09 /><hr />
      <h4>Ex10 – queryParam boolean coerce</h4><ex-10 /><hr />
      <h4>Ex11 – queryParam number coerce</h4><ex-11 /><hr />
      <h4>Ex12 – queryParam array (comma-separated)</h4><ex-12 /><hr />
      <h4>Ex13 – queryParam as filter state</h4><ex-13 /><hr />
      <h4>Ex14 – queryParam pagination</h4><ex-14 /><hr />
      <h4>Ex15 – queryParam sorting</h4><ex-15 /><hr />
      <h4>Ex16 – queryParam search</h4><ex-16 /><hr />
      <h4>Ex17 – update queryParam without full navigate</h4><ex-17 /><hr />
      <h4>Ex18 – merge queryParams</h4><ex-18 /><hr />
      <h4>Ex19 – preserve queryParams</h4><ex-19 /><hr />
      <h4>Ex20 – remove queryParam</h4><ex-20 /><hr />
      <h4>Ex21 – queryParam in service</h4><ex-21 /><hr />
      <h4>Ex22 – queryParam URL state management</h4><ex-22 /><hr />
      <h4>Ex23 – fragment param</h4><ex-23 /><hr />
      <h4>Ex24 – ActivatedRouteSnapshot</h4><ex-24 /><hr />
      <h4>Ex25 – RouterStateSnapshot</h4><ex-25 /><hr />
      <h4>Ex26 – parent route params access</h4><ex-26 /><hr />
      <h4>Ex27 – child route inheriting params</h4><ex-27 /><hr />
      <h4>Ex28 – paramMap.get vs .getAll</h4><ex-28 /><hr />
      <h4>Ex29 – params in resolver</h4><ex-29 /><hr />
      <h4>Ex30 – params in guard</h4><ex-30 /><hr />
      <h4>Ex31 – dynamic breadcrumb from params</h4><ex-31 /><hr />
      <h4>Ex32 – ActivatedRoute data (static)</h4><ex-32 /><hr />
      <h4>Ex33 – ActivatedRoute data (resolved)</h4><ex-33 /><hr />
      <h4>Ex34 – URL serializer concept</h4><ex-34 /><hr />
      <h4>Ex35 – URL matching (custom matcher)</h4><ex-35 /><hr />
      <h4>Ex36 – matrix params concept</h4><ex-36 /><hr />
      <h4>Ex37 – full URL state management pattern</h4><ex-37 /><hr />
      <h4>Ex38 – paramMap.has()</h4><ex-38 /><hr />
      <h4>Ex39 – queryParamMap.keys</h4><ex-39 /><hr />
      <h4>Ex40 – Optional route params</h4><ex-40 /><hr />
      <h4>Ex41 – params type coercion helper</h4><ex-41 /><hr />
      <h4>Ex42 – Multiple params on a route</h4><ex-42 /><hr />
      <h4>Ex43 – params change with same component</h4><ex-43 /><hr />
      <h4>Ex44 – queryParamMap in template</h4><ex-44 /><hr />
      <h4>Ex45 – Route with optional segment</h4><ex-45 /><hr />
      <h4>Ex46 – queryParam as enum</h4><ex-46 /><hr />
      <h4>Ex47 – Combine route params + query params</h4><ex-47 /><hr />
      <h4>Ex48 – Deep link reconstruction</h4><ex-48 /><hr />
      <h4>Ex49 – ParamMap vs params snapshot</h4><ex-49 /><hr />
      <h4>Ex50 – Full param-driven component demo</h4><ex-50 /><hr />
    </div>
  `
})
export class AppComponent {}
