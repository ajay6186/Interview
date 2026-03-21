import {
  Component, Injectable, inject, signal, computed, OnInit, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  HttpClient, HttpParams, HttpHeaders, HttpRequest, HttpEventType,
  HttpInterceptorFn, HttpHandlerFn, provideHttpClient, withInterceptors,
} from '@angular/common/http';
import {
  Observable, of, throwError, Subject, forkJoin, timer,
} from 'rxjs';
import {
  catchError, map, retry, timeout, switchMap, tap, shareReplay,
  debounceTime, distinctUntilChanged, retryWhen, delay, take,
} from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';

// ============================================================
// Examples 3.3 — HttpClient (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// Shared fake base URL (no real requests needed — patterns shown)
const API = 'https://jsonplaceholder.typicode.com';

interface Post { id: number; title: string; body: string; userId: number; }
interface User { id: number; name: string; email: string; }
interface Todo { id: number; title: string; completed: boolean; }

// ─── BASIC (1–13) ────────────────────────────────────────────

// 1. provideHttpClient — setup shown in providers
@Component({
  selector: 'ex-01', standalone: true,
  template: `<p>provideHttpClient() goes in bootstrapApplication providers array</p>`
})
class Ex01 {}

// 2. GET request
@Component({ selector: 'ex-02', standalone: true, template: `<p>{{ status }}</p><button (click)="load()">GET</button>` })
class Ex02 implements OnInit {
  status = 'idle';
  private http = inject(HttpClient);
  ngOnInit() { this.load(); }
  load() {
    this.status = 'loading...';
    this.http.get<Post[]>(`${API}/posts?_limit=3`).subscribe({
      next: posts => { this.status = `Loaded ${posts.length} posts`; },
      error: () => { this.status = 'error'; },
    });
  }
}

// 3. POST request
@Component({ selector: 'ex-03', standalone: true, template: `<p>{{ result }}</p><button (click)="submit()">POST</button>` })
class Ex03 {
  result = '';
  private http = inject(HttpClient);
  submit() {
    this.http.post<Post>(`${API}/posts`, { title: 'Test', body: 'Body', userId: 1 }).subscribe({
      next: p => { this.result = `Created post id: ${p.id}`; },
      error: () => { this.result = 'error'; },
    });
  }
}

// 4. PUT request
@Component({ selector: 'ex-04', standalone: true, template: `<p>{{ result }}</p><button (click)="update()">PUT</button>` })
class Ex04 {
  result = '';
  private http = inject(HttpClient);
  update() {
    this.http.put<Post>(`${API}/posts/1`, { id: 1, title: 'Updated', body: 'New body', userId: 1 }).subscribe({
      next: p => { this.result = `Updated: ${p.title}`; },
      error: () => { this.result = 'error'; },
    });
  }
}

// 5. DELETE request
@Component({ selector: 'ex-05', standalone: true, template: `<p>{{ result }}</p><button (click)="del()">DELETE</button>` })
class Ex05 {
  result = '';
  private http = inject(HttpClient);
  del() {
    this.http.delete(`${API}/posts/1`).subscribe({
      next: () => { this.result = 'Deleted successfully'; },
      error: () => { this.result = 'error'; },
    });
  }
}

// 6. PATCH request
@Component({ selector: 'ex-06', standalone: true, template: `<p>{{ result }}</p><button (click)="patch()">PATCH</button>` })
class Ex06 {
  result = '';
  private http = inject(HttpClient);
  patch() {
    this.http.patch<Post>(`${API}/posts/1`, { title: 'Patched Title' }).subscribe({
      next: p => { this.result = `Patched: ${p.title}`; },
      error: () => { this.result = 'error'; },
    });
  }
}

// 7. Request headers
@Component({ selector: 'ex-07', standalone: true, template: `<p>{{ result }}</p><button (click)="load()">GET with Headers</button>` })
class Ex07 {
  result = '';
  private http = inject(HttpClient);
  load() {
    const headers = new HttpHeaders({ 'Authorization': 'Bearer my-token', 'X-Custom': 'demo' });
    this.http.get<Post[]>(`${API}/posts?_limit=1`, { headers }).subscribe({
      next: posts => { this.result = `Got ${posts.length} post with custom headers`; },
      error: () => { this.result = 'error'; },
    });
  }
}

// 8. Query params with HttpParams
@Component({ selector: 'ex-08', standalone: true, template: `<p>{{ result }}</p><button (click)="search()">Search</button>` })
class Ex08 {
  result = '';
  private http = inject(HttpClient);
  search() {
    const params = new HttpParams().set('userId', '1').set('_limit', '3');
    this.http.get<Post[]>(`${API}/posts`, { params }).subscribe({
      next: posts => { this.result = `Found ${posts.length} posts for userId=1`; },
      error: () => { this.result = 'error'; },
    });
  }
}

// 9. Response type: json (default)
@Component({ selector: 'ex-09', standalone: true, template: `<p>{{ title }}</p><button (click)="load()">Get JSON</button>` })
class Ex09 {
  title = '';
  private http = inject(HttpClient);
  load() {
    this.http.get<Post>(`${API}/posts/1`).subscribe({ next: p => { this.title = p.title; } });
  }
}

// 10. Response type: text
@Component({ selector: 'ex-10', standalone: true, template: `<p>{{ snippet }}</p><button (click)="load()">Get Text</button>` })
class Ex10 {
  snippet = '';
  private http = inject(HttpClient);
  load() {
    this.http.get(`${API}/posts/1`, { responseType: 'text' }).subscribe({
      next: txt => { this.snippet = txt.slice(0, 80) + '...'; },
      error: () => { this.snippet = 'error'; },
    });
  }
}

// 11. Error handling with catchError
@Component({ selector: 'ex-11', standalone: true, template: `<p>{{ msg }}</p><button (click)="load()">Load (will fail)</button>` })
class Ex11 {
  msg = '';
  private http = inject(HttpClient);
  load() {
    this.http.get(`${API}/nonexistent-404-path`).pipe(
      catchError(err => { this.msg = `Error ${err.status}: ${err.message}`; return of(null); })
    ).subscribe();
  }
}

// 12. Loading state pattern
@Component({
  selector: 'ex-12', standalone: true,
  template: `
    @if (loading) { <p>Loading...</p> }
    @else if (error) { <p style="color:red">Error: {{ error }}</p> }
    @else { <p>{{ data }}</p> }
    <button (click)="load()">Reload</button>
  `
})
class Ex12 {
  loading = false; error = ''; data = '';
  private http = inject(HttpClient);
  load() {
    this.loading = true; this.error = '';
    this.http.get<Post>(`${API}/posts/2`).pipe(
      catchError(err => { this.error = err.message; return of(null); })
    ).subscribe(p => { this.loading = false; this.data = p ? p.title : ''; });
  }
}

// 13. Type-safe response with interface
@Component({ selector: 'ex-13', standalone: true, template: `<p>{{ user }}</p><button (click)="load()">Load User</button>` })
class Ex13 {
  user = '';
  private http = inject(HttpClient);
  load() {
    this.http.get<User>(`${API}/users/1`).subscribe({ next: u => { this.user = `${u.name} (${u.email})`; } });
  }
}

// ─── INTERMEDIATE (14–26) ─────────────────────────────────────

// 14. toSignal with HttpClient
@Component({
  selector: 'ex-14', standalone: true,
  template: `
    @if (posts()) { <p>{{ posts()![0].title }}</p> }
    @else { <p>Loading...</p> }
  `
})
class Ex14 {
  private http = inject(HttpClient);
  posts = toSignal(this.http.get<Post[]>(`${API}/posts?_limit=1`));
}

// 15. async pipe with Observable
@Component({
  selector: 'ex-15', standalone: true, imports: [AsyncPipe],
  template: `
    @if (user$ | async; as u) { <p>{{ u.name }}</p> }
    @else { <p>Loading...</p> }
  `
})
class Ex15 {
  private http = inject(HttpClient);
  user$ = this.http.get<User>(`${API}/users/2`);
}

// 16. retry on failure
@Component({ selector: 'ex-16', standalone: true, template: `<p>{{ msg }}</p><button (click)="load()">Load with retry</button>` })
class Ex16 {
  msg = '';
  private http = inject(HttpClient);
  load() {
    this.http.get<Post>(`${API}/posts/3`).pipe(
      retry(2),
      catchError(() => { this.msg = 'Failed after 3 attempts'; return of(null); })
    ).subscribe(p => { if (p) this.msg = `Loaded: ${p.title}`; });
  }
}

// 17. timeout operator
@Component({ selector: 'ex-17', standalone: true, template: `<p>{{ msg }}</p><button (click)="load()">Load with 5s timeout</button>` })
class Ex17 {
  msg = '';
  private http = inject(HttpClient);
  load() {
    this.http.get<Post>(`${API}/posts/4`).pipe(
      timeout(5000),
      catchError(err => { this.msg = `Timeout or error: ${err.name}`; return of(null); })
    ).subscribe(p => { if (p) this.msg = p.title; });
  }
}

// 18. map the response
@Component({ selector: 'ex-18', standalone: true, template: `<p>{{ titles }}</p><button (click)="load()">Load + Map</button>` })
class Ex18 {
  titles = '';
  private http = inject(HttpClient);
  load() {
    this.http.get<Post[]>(`${API}/posts?_limit=4`).pipe(
      map(posts => posts.map(p => p.title).join(' | '))
    ).subscribe(t => { this.titles = t; });
  }
}

// 19. forkJoin parallel requests
@Component({
  selector: 'ex-19', standalone: true,
  template: `<p>{{ result }}</p><button (click)="load()">Load in Parallel</button>`
})
class Ex19 {
  result = '';
  private http = inject(HttpClient);
  load() {
    forkJoin({
      post: this.http.get<Post>(`${API}/posts/1`),
      user: this.http.get<User>(`${API}/users/1`),
    }).subscribe({
      next: ({ post, user }) => { this.result = `Post: "${post.title}" by ${user.name}`; },
      error: () => { this.result = 'error'; },
    });
  }
}

// 20. switchMap chained requests
@Component({
  selector: 'ex-20', standalone: true,
  template: `<p>{{ result }}</p><button (click)="load()">Chain Requests</button>`
})
class Ex20 {
  result = '';
  private http = inject(HttpClient);
  load() {
    this.http.get<Post>(`${API}/posts/1`).pipe(
      switchMap(post => this.http.get<User>(`${API}/users/${post.userId}`).pipe(
        map(user => ({ post, user }))
      ))
    ).subscribe({
      next: ({ post, user }) => { this.result = `"${post.title}" — by ${user.name}`; },
      error: () => { this.result = 'error'; },
    });
  }
}

// 21. HttpParams builder pattern
@Component({ selector: 'ex-21', standalone: true, template: `<p>{{ url }}</p><button (click)="build()">Build Params</button>` })
class Ex21 {
  url = '';
  build() {
    const params = new HttpParams({ fromObject: { page: '2', limit: '10', sort: 'name', order: 'asc' } });
    this.url = `${API}/users?${params.toString()}`;
  }
}

// 22. Response body + status (observe: 'response')
@Component({ selector: 'ex-22', standalone: true, template: `<p>{{ info }}</p><button (click)="load()">Load with Status</button>` })
class Ex22 {
  info = '';
  private http = inject(HttpClient);
  load() {
    this.http.get<Post>(`${API}/posts/5`, { observe: 'response' }).subscribe({
      next: resp => { this.info = `Status: ${resp.status} | Title: ${resp.body?.title}`; },
      error: () => { this.info = 'error'; },
    });
  }
}

// 23. tap for side effects (logging)
@Component({ selector: 'ex-23', standalone: true, template: `<p>{{ msg }}</p><button (click)="load()">Load with tap</button>` })
class Ex23 {
  msg = '';
  private http = inject(HttpClient);
  load() {
    this.http.get<Post>(`${API}/posts/6`).pipe(
      tap(p => { console.log('Ex23 tap: received post', p.id); }),
      map(p => p.title)
    ).subscribe(title => { this.msg = title; });
  }
}

// 24. toSignal with loading state using startWith
@Component({
  selector: 'ex-24', standalone: true,
  template: `<p>{{ data() ?? 'Loading...' }}</p>`
})
class Ex24 {
  private http = inject(HttpClient);
  private dr = inject(DestroyRef);
  data = signal<string | null>(null);
  constructor() {
    this.http.get<Todo>(`${API}/todos/1`)
      .pipe(takeUntilDestroyed(this.dr))
      .subscribe(t => this.data.set(`${t.title} [${t.completed ? 'done' : 'open'}]`));
  }
}

// 25. Type the response with generic interface
@Component({ selector: 'ex-25', standalone: true, template: `<p>{{ email }}</p><button (click)="load()">Load</button>` })
class Ex25 {
  email = '';
  private http = inject(HttpClient);
  load() { this.http.get<User>(`${API}/users/3`).subscribe(u => { this.email = u.email; }); }
}

// 26. catchError returning fallback data
@Component({
  selector: 'ex-26', standalone: true,
  template: `<ul>@for (p of posts; track p.id) { <li>{{ p.title }}</li> }</ul><button (click)="load()">Load</button>`
})
class Ex26 {
  posts: Post[] = [];
  private http = inject(HttpClient);
  private fallback: Post[] = [{ id: 0, title: 'Fallback Post', body: '', userId: 0 }];
  load() {
    this.http.get<Post[]>(`${API}/posts?_limit=2`).pipe(
      catchError(() => of(this.fallback))
    ).subscribe(p => { this.posts = p; });
  }
}

// ─── NESTED (27–38) ───────────────────────────────────────────

// 27. Service-level HTTP + component-level display
@Injectable({ providedIn: 'root' })
class PostService {
  private http = inject(HttpClient);
  getPost(id: number) { return this.http.get<Post>(`${API}/posts/${id}`); }
  getPosts(limit = 5) { return this.http.get<Post[]>(`${API}/posts?_limit=${limit}`); }
}

@Component({
  selector: 'ex-27', standalone: true,
  template: `
    @if (post) { <p><strong>{{ post.title }}</strong></p><p>{{ post.body }}</p> }
    @else { <p>No post loaded</p> }
    <button (click)="load()">Load Post 7</button>
  `
})
class Ex27 implements OnInit {
  post: Post | null = null;
  private svc = inject(PostService);
  ngOnInit() { this.load(); }
  load() { this.svc.getPost(7).subscribe(p => { this.post = p; }); }
}

// 28. HTTP with loading / error / data states (signal-based)
@Component({
  selector: 'ex-28', standalone: true,
  template: `
    @switch (status()) {
      @case ('loading') { <p>Loading...</p> }
      @case ('error') { <p style="color:red">Error: {{ error() }}</p> }
      @case ('ready') {
        <ul>@for (p of posts(); track p.id) { <li>{{ p.title }}</li> }</ul>
      }
    }
    <button (click)="reload()">Load</button>
  `
})
class Ex28 {
  status = signal<'idle' | 'loading' | 'error' | 'ready'>('idle');
  error = signal('');
  posts = signal<Post[]>([]);
  private svc = inject(PostService);
  reload() {
    this.status.set('loading');
    this.svc.getPosts(3).pipe(
      catchError(err => { this.error.set(err.message); this.status.set('error'); return of([]); })
    ).subscribe(p => { this.posts.set(p); this.status.set('ready'); });
  }
}

// 29. Pagination HTTP
@Component({
  selector: 'ex-29', standalone: true,
  template: `
    <ul>@for (p of posts; track p.id) { <li>{{ p.id }}. {{ p.title }}</li> }</ul>
    <button (click)="prev()" [disabled]="page <= 1">Prev</button>
    <span> Page {{ page }} </span>
    <button (click)="next()">Next</button>
  `
})
class Ex29 {
  posts: Post[] = [];
  page = 1;
  private http = inject(HttpClient);
  private load() {
    const params = new HttpParams().set('_page', this.page).set('_limit', '3');
    this.http.get<Post[]>(`${API}/posts`, { params }).subscribe(p => { this.posts = p; });
  }
  ngOnInit() { this.load(); }
  next() { this.page++; this.load(); }
  prev() { if (this.page > 1) { this.page--; this.load(); } }
}

// 30. Search with debounce + switchMap
@Component({
  selector: 'ex-30', standalone: true,
  template: `
    <input (input)="search$.next($any($event).target.value)" placeholder="Search posts..." />
    <ul>@for (p of results; track p.id) { <li>{{ p.title }}</li> }</ul>
  `
})
class Ex30 implements OnInit {
  results: Post[] = [];
  search$ = new Subject<string>();
  private http = inject(HttpClient);
  private dr = inject(DestroyRef);
  ngOnInit() {
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => q ? this.http.get<Post[]>(`${API}/posts?title_like=${encodeURIComponent(q)}&_limit=3`) : of([])),
      takeUntilDestroyed(this.dr)
    ).subscribe(r => { this.results = r; });
  }
}

// 31. CRUD service with signal store
@Injectable({ providedIn: 'root' })
class TodoHttpService {
  private http = inject(HttpClient);
  items = signal<Todo[]>([]);
  loading = signal(false);

  loadAll() {
    this.loading.set(true);
    this.http.get<Todo[]>(`${API}/todos?_limit=5`).subscribe(t => { this.items.set(t); this.loading.set(false); });
  }
  toggle(id: number) {
    const item = this.items().find(t => t.id === id);
    if (!item) return;
    this.http.patch<Todo>(`${API}/todos/${id}`, { completed: !item.completed })
      .subscribe(updated => { this.items.update(list => list.map(t => t.id === id ? updated : t)); });
  }
}

@Component({
  selector: 'ex-31', standalone: true,
  template: `
    @if (svc.loading()) { <p>Loading...</p> }
    <ul>
      @for (t of svc.items(); track t.id) {
        <li [style.textDecoration]="t.completed ? 'line-through' : 'none'" (click)="svc.toggle(t.id)" style="cursor:pointer">
          {{ t.title }}
        </li>
      }
    </ul>
    <button (click)="svc.loadAll()">Load Todos</button>
  `
})
class Ex31 { svc = inject(TodoHttpService); }

// 32. Cache pattern with shareReplay
@Injectable({ providedIn: 'root' })
class CachedPostService {
  private http = inject(HttpClient);
  private cache$ = this.http.get<Post[]>(`${API}/posts?_limit=3`).pipe(shareReplay(1));
  getPosts() { return this.cache$; }
}

@Component({
  selector: 'ex-32', standalone: true,
  template: `
    <ul>@for (p of posts; track p.id) { <li>{{ p.title }}</li> }</ul>
    <button (click)="load()">Load (cached after first)</button>
  `
})
class Ex32 {
  posts: Post[] = [];
  private svc = inject(CachedPostService);
  load() { this.svc.getPosts().subscribe(p => { this.posts = p; }); }
}

// 33. HTTP with multiple states via enum-like signal
type LoadState = 'idle' | 'loading' | 'success' | 'failure';

@Component({
  selector: 'ex-33', standalone: true,
  template: `
    @switch (state()) {
      @case ('idle') { <button (click)="fetch()">Fetch User</button> }
      @case ('loading') { <p>Fetching...</p> }
      @case ('success') { <p>{{ user()?.name }} — {{ user()?.email }}</p> }
      @case ('failure') { <p style="color:red">Failed to load</p> }
    }
  `
})
class Ex33 {
  state = signal<LoadState>('idle');
  user = signal<User | null>(null);
  private http = inject(HttpClient);
  fetch() {
    this.state.set('loading');
    this.http.get<User>(`${API}/users/4`).pipe(
      catchError(() => { this.state.set('failure'); return of(null); })
    ).subscribe(u => { if (u) { this.user.set(u); this.state.set('success'); } });
  }
}

// 34. POST + response display
@Component({
  selector: 'ex-34', standalone: true,
  template: `<p>{{ result }}</p><button (click)="create()">Create Post</button>`
})
class Ex34 {
  result = '';
  private http = inject(HttpClient);
  create() {
    this.http.post<Post>(`${API}/posts`, { title: 'New Post', body: 'Content', userId: 1 }).subscribe({
      next: p => { this.result = `Created ID ${p.id}: ${p.title}`; },
      error: () => { this.result = 'error'; },
    });
  }
}

// 35. HTTP + local filter + signal
@Component({
  selector: 'ex-35', standalone: true,
  template: `
    <input (input)="filter.set($any($event).target.value)" placeholder="Filter by name..." />
    <ul>@for (u of filtered(); track u.id) { <li>{{ u.name }}</li> }</ul>
    <button (click)="load()">Load Users</button>
  `
})
class Ex35 {
  private all = signal<User[]>([]);
  filter = signal('');
  filtered = computed(() => {
    const q = this.filter().toLowerCase();
    return q ? this.all().filter(u => u.name.toLowerCase().includes(q)) : this.all();
  });
  private http = inject(HttpClient);
  load() { this.http.get<User[]>(`${API}/users`).subscribe(u => { this.all.set(u); }); }
}

// 36. HTTP with optimistic update
@Component({
  selector: 'ex-36', standalone: true,
  template: `
    <ul>@for (t of todos(); track t.id) { <li>{{ t.id }}. {{ t.title }} [{{ t.completed ? 'done' : 'open' }}]</li> }</ul>
    <button (click)="load()">Load</button>
    <button (click)="optimisticToggle(1)">Optimistic Toggle #1</button>
  `
})
class Ex36 {
  todos = signal<Todo[]>([]);
  private http = inject(HttpClient);
  load() { this.http.get<Todo[]>(`${API}/todos?_limit=3`).subscribe(t => { this.todos.set(t); }); }
  optimisticToggle(id: number) {
    const prev = this.todos();
    this.todos.update(list => list.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    const item = prev.find(t => t.id === id);
    if (item) {
      this.http.patch<Todo>(`${API}/todos/${id}`, { completed: !item.completed }).pipe(
        catchError(() => { this.todos.set(prev); return of(null); })
      ).subscribe();
    }
  }
}

// 37. PUT with full replace
@Component({
  selector: 'ex-37', standalone: true,
  template: `<p>{{ msg }}</p><button (click)="replace()">PUT Replace</button>`
})
class Ex37 {
  msg = '';
  private http = inject(HttpClient);
  replace() {
    this.http.put<Post>(`${API}/posts/10`, { id: 10, title: 'Full Replace', body: 'New content', userId: 5 })
      .subscribe({ next: p => { this.msg = `Replaced: ${p.title}`; }, error: () => { this.msg = 'error'; } });
  }
}

// 38. forkJoin for dashboard data
@Component({
  selector: 'ex-38', standalone: true,
  template: `
    @if (loaded()) {
      <p>Posts: {{ postCount() }} | Users: {{ userCount() }}</p>
    } @else {
      <button (click)="loadDashboard()">Load Dashboard</button>
    }
  `
})
class Ex38 {
  loaded = signal(false);
  postCount = signal(0);
  userCount = signal(0);
  private http = inject(HttpClient);
  loadDashboard() {
    forkJoin({
      posts: this.http.get<Post[]>(`${API}/posts?_limit=5`),
      users: this.http.get<User[]>(`${API}/users`),
    }).subscribe(({ posts, users }) => {
      this.postCount.set(posts.length);
      this.userCount.set(users.length);
      this.loaded.set(true);
    });
  }
}

// ─── ADVANCED (39–50) ─────────────────────────────────────────

// 39. HTTP interceptors (functional) — auth header
const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = 'demo-auth-token';
  const authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  return next(authReq);
};

@Component({
  selector: 'ex-39', standalone: true,
  template: `<p>Auth interceptor adds Bearer token to every request (see network tab)</p>`
})
class Ex39 {}

// 40. Logging interceptor
const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  return next(req).pipe(
    tap(event => { if ((event as any).status) console.log(`[HTTP] Response status: ${(event as any).status}`); })
  );
};

@Component({
  selector: 'ex-40', standalone: true,
  template: `<p>loggingInterceptor logs method + url (check console on HTTP calls)</p>`
})
class Ex40 {}

// 41. Error interceptor
const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError(err => {
      if (err.status === 401) { console.warn('[Auth] Unauthorized — redirect to login'); }
      if (err.status === 500) { console.error('[Server] Internal error'); }
      return throwError(() => err);
    })
  );
};

@Component({
  selector: 'ex-41', standalone: true,
  template: `<p>errorInterceptor handles 401 and 500 globally</p>`
})
class Ex41 {}

// 42. Retry interceptor with exponential backoff
const retryInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    retryWhen(errors => errors.pipe(
      delay(1000),
      take(3),
    ))
  );
};

@Component({
  selector: 'ex-42', standalone: true,
  template: `<p>retryInterceptor retries failed requests 3 times with 1s delay</p>`
})
class Ex42 {}

// 43. Request cloning in interceptor
const addJsonContentType: HttpInterceptorFn = (req, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    const cloned = req.clone({ setHeaders: { 'Content-Type': 'application/json' } });
    return next(cloned);
  }
  return next(req);
};

@Component({
  selector: 'ex-43', standalone: true,
  template: `<p>addJsonContentType interceptor clones + sets Content-Type for POST/PUT</p>`
})
class Ex43 {}

// 44. Response transformation interceptor
const camelCaseInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    map(event => {
      if ((event as any).type === HttpEventType.Response && (event as any).body) {
        console.log('[Transform] Could transform response keys here');
      }
      return event;
    })
  );
};

@Component({
  selector: 'ex-44', standalone: true,
  template: `<p>camelCaseInterceptor demonstrates response body transformation pattern</p>`
})
class Ex44 {}

// 45. Loading state interceptor
const loadingState = signal(false);
const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  loadingState.set(true);
  return next(req).pipe(
    tap({ complete: () => loadingState.set(false), error: () => loadingState.set(false) })
  );
};

@Component({
  selector: 'ex-45', standalone: true,
  template: `<p>Global loading: {{ loading() }}</p><p>loadingInterceptor sets signal on request start/end</p>`
})
class Ex45 { loading = loadingState; }

// 46. Request deduplication pattern
@Injectable({ providedIn: 'root' })
class DedupeHttpService {
  private http = inject(HttpClient);
  private inFlight = new Map<string, Observable<any>>();
  get<T>(url: string): Observable<T> {
    if (this.inFlight.has(url)) { return this.inFlight.get(url) as Observable<T>; }
    const req = this.http.get<T>(url).pipe(shareReplay(1), tap({ complete: () => this.inFlight.delete(url) }));
    this.inFlight.set(url, req);
    return req;
  }
}

@Component({
  selector: 'ex-46', standalone: true,
  template: `<p>{{ msg }}</p><button (click)="load()">Load (deduplicated)</button>`
})
class Ex46 {
  msg = '';
  private svc = inject(DedupeHttpService);
  load() {
    this.svc.get<Post>(`${API}/posts/1`).subscribe(p => { this.msg = p.title; });
    this.svc.get<Post>(`${API}/posts/1`).subscribe(p => { console.log('Ex46 second call deduped:', p.id); });
  }
}

// 47. Progressive retry with backoff
@Component({
  selector: 'ex-47', standalone: true,
  template: `<p>{{ msg }}</p><button (click)="load()">Load with backoff retry</button>`
})
class Ex47 {
  msg = '';
  private http = inject(HttpClient);
  load() {
    let attempt = 0;
    this.http.get<Post>(`${API}/posts/8`).pipe(
      retryWhen(errors => errors.pipe(
        switchMap(err => {
          attempt++;
          if (attempt >= 3) return throwError(() => err);
          const backoff = attempt * 500;
          console.log(`Ex47 retry attempt ${attempt} in ${backoff}ms`);
          return timer(backoff);
        })
      )),
      catchError(() => { this.msg = 'Failed after retries'; return of(null); })
    ).subscribe(p => { if (p) this.msg = `Loaded: ${p.title}`; });
  }
}

// 48. environment-based base URL via InjectionToken
const ENV_API = new InjectionToken<string>('ENV_API');

@Injectable()
class EnvApiService {
  private base = inject(ENV_API);
  private http = inject(HttpClient);
  getPost(id: number) { return this.http.get<Post>(`${this.base}/posts/${id}`); }
}

@Component({
  selector: 'ex-48', standalone: true,
  providers: [
    { provide: ENV_API, useValue: API },
    EnvApiService,
  ],
  template: `<p>{{ title }}</p><button (click)="load()">Load from env URL</button>`
})
class Ex48 {
  title = '';
  private svc = inject(EnvApiService);
  load() { this.svc.getPost(9).subscribe(p => { this.title = p.title; }); }
}

// 49. HTTP with signal resource (manual implementation for Angular 17)
@Injectable({ providedIn: 'root' })
class ResourceService {
  private http = inject(HttpClient);
  private dr = inject(DestroyRef);

  createResource<T>(url: () => string) {
    const data = signal<T | null>(null);
    const loading = signal(false);
    const error = signal<string | null>(null);
    const reload = () => {
      loading.set(true); error.set(null);
      this.http.get<T>(url()).pipe(
        catchError(e => { error.set(e.message); loading.set(false); return of(null); }),
        takeUntilDestroyed(this.dr)
      ).subscribe(d => { data.set(d); loading.set(false); });
    };
    return { data, loading, error, reload };
  }
}

@Component({
  selector: 'ex-49', standalone: true,
  template: `
    @if (res.loading()) { <p>Loading...</p> }
    @else if (res.error()) { <p style="color:red">{{ res.error() }}</p> }
    @else if (res.data()) { <p>{{ res.data()!.title }}</p> }
    <button (click)="res.reload()">Load Resource</button>
  `
})
class Ex49 {
  private svc = inject(ResourceService);
  res = this.svc.createResource<Post>(() => `${API}/posts/10`);
}

// 50. Full HTTP pattern — CRUD service + signal store + error/loading states
@Injectable({ providedIn: 'root' })
class FullCrudService {
  private http = inject(HttpClient);
  posts = signal<Post[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  load() {
    this.loading.set(true); this.error.set(null);
    this.http.get<Post[]>(`${API}/posts?_limit=4`).pipe(
      catchError(e => { this.error.set(e.message); return of([]); })
    ).subscribe(p => { this.posts.set(p); this.loading.set(false); });
  }

  add() {
    this.http.post<Post>(`${API}/posts`, { title: 'New', body: 'B', userId: 1 }).subscribe(
      p => { this.posts.update(arr => [p, ...arr]); }
    );
  }

  remove(id: number) {
    this.http.delete(`${API}/posts/${id}`).subscribe(
      () => { this.posts.update(arr => arr.filter(p => p.id !== id)); }
    );
  }
}

@Component({
  selector: 'ex-50', standalone: true,
  template: `
    @if (svc.loading()) { <p>Loading...</p> }
    @else if (svc.error()) { <p style="color:red">{{ svc.error() }}</p> }
    @else {
      <ul>
        @for (p of svc.posts(); track p.id) {
          <li>{{ p.title }} <button (click)="svc.remove(p.id)">x</button></li>
        }
      </ul>
    }
    <button (click)="svc.load()">Load</button>
    <button (click)="svc.add()">Add Post</button>
  `
})
class Ex50 { svc = inject(FullCrudService); }

// ─── App Root ─────────────────────────────────────────────────

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
      <h1>Examples 3.3 — HttpClient</h1>
      <h4>1. provideHttpClient setup</h4><ex-01 /><hr />
      <h4>2. GET request</h4><ex-02 /><hr />
      <h4>3. POST request</h4><ex-03 /><hr />
      <h4>4. PUT request</h4><ex-04 /><hr />
      <h4>5. DELETE request</h4><ex-05 /><hr />
      <h4>6. PATCH request</h4><ex-06 /><hr />
      <h4>7. Request headers</h4><ex-07 /><hr />
      <h4>8. Query params with HttpParams</h4><ex-08 /><hr />
      <h4>9. Response type: json</h4><ex-09 /><hr />
      <h4>10. Response type: text</h4><ex-10 /><hr />
      <h4>11. Error handling with catchError</h4><ex-11 /><hr />
      <h4>12. Loading state pattern</h4><ex-12 /><hr />
      <h4>13. Type-safe response with interface</h4><ex-13 /><hr />
      <h4>14. toSignal with HttpClient</h4><ex-14 /><hr />
      <h4>15. async pipe with Observable</h4><ex-15 /><hr />
      <h4>16. retry on failure</h4><ex-16 /><hr />
      <h4>17. timeout operator</h4><ex-17 /><hr />
      <h4>18. map the response</h4><ex-18 /><hr />
      <h4>19. forkJoin parallel requests</h4><ex-19 /><hr />
      <h4>20. switchMap chained requests</h4><ex-20 /><hr />
      <h4>21. HttpParams builder pattern</h4><ex-21 /><hr />
      <h4>22. Response body + status (observe: 'response')</h4><ex-22 /><hr />
      <h4>23. tap for side effects</h4><ex-23 /><hr />
      <h4>24. toSignal with loading state</h4><ex-24 /><hr />
      <h4>25. Type the response with generic interface</h4><ex-25 /><hr />
      <h4>26. catchError returning fallback data</h4><ex-26 /><hr />
      <h4>27. Service-level HTTP + component display</h4><ex-27 /><hr />
      <h4>28. HTTP with loading/error/data states (signals)</h4><ex-28 /><hr />
      <h4>29. Pagination HTTP</h4><ex-29 /><hr />
      <h4>30. Search with debounce + switchMap</h4><ex-30 /><hr />
      <h4>31. CRUD service with signal store</h4><ex-31 /><hr />
      <h4>32. Cache pattern with shareReplay</h4><ex-32 /><hr />
      <h4>33. HTTP with multiple states (LoadState enum)</h4><ex-33 /><hr />
      <h4>34. POST + response display</h4><ex-34 /><hr />
      <h4>35. HTTP + local filter + signal</h4><ex-35 /><hr />
      <h4>36. HTTP with optimistic update</h4><ex-36 /><hr />
      <h4>37. PUT with full replace</h4><ex-37 /><hr />
      <h4>38. forkJoin for dashboard data</h4><ex-38 /><hr />
      <h4>39. Auth header interceptor (functional)</h4><ex-39 /><hr />
      <h4>40. Logging interceptor</h4><ex-40 /><hr />
      <h4>41. Error interceptor</h4><ex-41 /><hr />
      <h4>42. Retry interceptor with backoff</h4><ex-42 /><hr />
      <h4>43. Request cloning in interceptor</h4><ex-43 /><hr />
      <h4>44. Response transformation interceptor</h4><ex-44 /><hr />
      <h4>45. Loading state interceptor</h4><ex-45 /><hr />
      <h4>46. Request deduplication pattern</h4><ex-46 /><hr />
      <h4>47. Progressive retry with backoff</h4><ex-47 /><hr />
      <h4>48. Environment-based base URL</h4><ex-48 /><hr />
      <h4>49. Manual signal resource pattern</h4><ex-49 /><hr />
      <h4>50. Full CRUD — signal store + HTTP</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
