import {
  Component, signal, computed, inject, OnInit
} from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  HttpClient, HttpHeaders, HttpParams,
  provideHttpClient
} from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Observable, of, Subject, BehaviorSubject, EMPTY
} from 'rxjs';
import {
  catchError, map, switchMap, debounceTime, distinctUntilChanged,
  retry, tap, shareReplay, take, finalize, timeout, forkJoin, startWith
} from 'rxjs/operators';

const API = 'https://jsonplaceholder.typicode.com';

// ── Ex01 – HTTP GET ──────────────────────────────────────────────────────────
@Component({
  selector: 'ex-01', standalone: true, imports: [CommonModule],
  providers: [provideHttpClient()],
  template: `
    <button (click)="load()">GET /posts/1</button>
    @if (post) { <pre>{{ post | json }}</pre> }
  `
})
export class Ex01 {
  http = inject(HttpClient);
  post: unknown = null;
  load() { this.http.get(`${API}/posts/1`).subscribe(d => (this.post = d)); }
}

// ── Ex02 – HTTP POST ─────────────────────────────────────────────────────────
@Component({
  selector: 'ex-02', standalone: true, imports: [CommonModule],
  providers: [provideHttpClient()],
  template: `
    <button (click)="create()">POST new post</button>
    @if (result) { <pre>{{ result | json }}</pre> }
  `
})
export class Ex02 {
  http = inject(HttpClient);
  result: unknown = null;
  create() {
    this.http.post(`${API}/posts`, { title: 'Hello', body: 'World', userId: 1 })
      .subscribe(d => (this.result = d));
  }
}

// ── Ex03 – HTTP PUT ──────────────────────────────────────────────────────────
@Component({
  selector: 'ex-03', standalone: true, imports: [CommonModule],
  providers: [provideHttpClient()],
  template: `
    <button (click)="update()">PUT /posts/1</button>
    @if (result) { <pre>{{ result | json }}</pre> }
  `
})
export class Ex03 {
  http = inject(HttpClient);
  result: unknown = null;
  update() {
    this.http.put(`${API}/posts/1`, { id: 1, title: 'Updated', body: 'Body', userId: 1 })
      .subscribe(d => (this.result = d));
  }
}

// ── Ex04 – HTTP DELETE ───────────────────────────────────────────────────────
@Component({
  selector: 'ex-04', standalone: true,
  providers: [provideHttpClient()],
  template: `
    <button (click)="remove()">DELETE /posts/1</button>
    <p>{{ status }}</p>
  `
})
export class Ex04 {
  http = inject(HttpClient);
  status = '';
  remove() {
    this.http.delete(`${API}/posts/1`).subscribe({
      next: () => (this.status = 'Deleted!'),
      error: () => (this.status = 'Error')
    });
  }
}

// ── Ex05 – HTTP PATCH ────────────────────────────────────────────────────────
@Component({
  selector: 'ex-05', standalone: true, imports: [CommonModule],
  providers: [provideHttpClient()],
  template: `
    <button (click)="patch()">PATCH /posts/1</button>
    @if (result) { <pre>{{ result | json }}</pre> }
  `
})
export class Ex05 {
  http = inject(HttpClient);
  result: unknown = null;
  patch() {
    this.http.patch(`${API}/posts/1`, { title: 'Patched Title' })
      .subscribe(d => (this.result = d));
  }
}

// ── Ex06 – HTTP headers ──────────────────────────────────────────────────────
@Component({
  selector: 'ex-06', standalone: true, imports: [CommonModule],
  providers: [provideHttpClient()],
  template: `
    <button (click)="load()">GET with headers</button>
    @if (data) { <pre>{{ data | json }}</pre> }
  `
})
export class Ex06 {
  http = inject(HttpClient);
  data: unknown = null;
  load() {
    const headers = new HttpHeaders({ 'X-Custom-Header': 'angular', 'Accept': 'application/json' });
    this.http.get(`${API}/posts/1`, { headers }).subscribe(d => (this.data = d));
  }
}

// ── Ex07 – query params ──────────────────────────────────────────────────────
@Component({
  selector: 'ex-07', standalone: true, imports: [CommonModule],
  providers: [provideHttpClient()],
  template: `
    <button (click)="load()">GET with query params</button>
    <p>Count: {{ count }}</p>
  `
})
export class Ex07 {
  http = inject(HttpClient);
  count = 0;
  load() {
    const params = new HttpParams().set('_limit', '5').set('userId', '1');
    this.http.get<unknown[]>(`${API}/posts`, { params })
      .subscribe(d => (this.count = d.length));
  }
}

// ── Ex08 – HttpParams builder ────────────────────────────────────────────────
@Component({
  selector: 'ex-08', standalone: true, imports: [CommonModule],
  providers: [provideHttpClient()],
  template: `
    <button (click)="load()">GET w/ HttpParams builder</button>
    <p>{{ result }}</p>
  `
})
export class Ex08 {
  http = inject(HttpClient);
  result = '';
  load() {
    let params = new HttpParams();
    params = params.append('_limit', '3');
    params = params.append('_start', '0');
    this.http.get<unknown[]>(`${API}/comments`, { params })
      .subscribe(d => (this.result = `Got ${d.length} comments`));
  }
}

// ── Ex09 – response types ────────────────────────────────────────────────────
@Component({
  selector: 'ex-09', standalone: true,
  providers: [provideHttpClient()],
  template: `
    <button (click)="loadText()">GET as text</button>
    <p>{{ text }}</p>
  `
})
export class Ex09 {
  http = inject(HttpClient);
  text = '';
  loadText() {
    this.http.get(`${API}/posts/1`, { responseType: 'text' })
      .subscribe(t => (this.text = t.slice(0, 100)));
  }
}

// ── Ex10 – error handling ────────────────────────────────────────────────────
@Component({
  selector: 'ex-10', standalone: true,
  providers: [provideHttpClient()],
  template: `
    <button (click)="load()">GET 404</button>
    <p>{{ msg }}</p>
  `
})
export class Ex10 {
  http = inject(HttpClient);
  msg = '';
  load() {
    this.http.get(`${API}/nonexistent-endpoint-404`).pipe(
      catchError(err => { this.msg = `Error ${err.status}: ${err.message}`; return EMPTY; })
    ).subscribe();
  }
}

// ── Ex11 – loading state ─────────────────────────────────────────────────────
@Component({
  selector: 'ex-11', standalone: true, imports: [CommonModule],
  providers: [provideHttpClient()],
  template: `
    <button (click)="load()" [disabled]="loading()">
      {{ loading() ? 'Loading…' : 'Fetch' }}
    </button>
    @if (data()) { <p>{{ data()?.title }}</p> }
  `
})
export class Ex11 {
  http = inject(HttpClient);
  loading = signal(false);
  data = signal<{ title: string } | null>(null);
  load() {
    this.loading.set(true);
    this.http.get<{ title: string }>(`${API}/posts/1`).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe(d => this.data.set(d));
  }
}

// ── Ex12 – retry ─────────────────────────────────────────────────────────────
@Component({
  selector: 'ex-12', standalone: true,
  providers: [provideHttpClient()],
  template: `
    <button (click)="load()">GET with retry(2)</button>
    <p>{{ status }}</p>
  `
})
export class Ex12 {
  http = inject(HttpClient);
  status = '';
  load() {
    this.http.get(`${API}/posts/1`).pipe(
      retry(2),
      catchError(() => { this.status = 'Failed after retries'; return EMPTY; })
    ).subscribe(() => (this.status = 'Success'));
  }
}

// ── Ex13 – timeout ───────────────────────────────────────────────────────────
@Component({
  selector: 'ex-13', standalone: true,
  providers: [provideHttpClient()],
  template: `
    <button (click)="load()">GET with 5s timeout</button>
    <p>{{ status }}</p>
  `
})
export class Ex13 {
  http = inject(HttpClient);
  status = '';
  load() {
    this.http.get(`${API}/posts/1`).pipe(
      timeout(5000),
      catchError(() => { this.status = 'Timed out!'; return EMPTY; })
    ).subscribe(() => (this.status = 'OK'));
  }
}

// ── Ex14 – forkJoin multiple requests ────────────────────────────────────────
@Component({
  selector: 'ex-14', standalone: true, imports: [CommonModule],
  providers: [provideHttpClient()],
  template: `
    <button (click)="load()">forkJoin 3 requests</button>
    @if (results) { <pre>{{ results | json }}</pre> }
  `
})
export class Ex14 {
  http = inject(HttpClient);
  results: unknown = null;
  load() {
    forkJoin({
      post: this.http.get(`${API}/posts/1`),
      user: this.http.get(`${API}/users/1`),
      todo: this.http.get(`${API}/todos/1`)
    }).subscribe(r => (this.results = r));
  }
}

// ── Ex15 – switchMap chain ───────────────────────────────────────────────────
@Component({
  selector: 'ex-15', standalone: true, imports: [CommonModule],
  providers: [provideHttpClient()],
  template: `
    <input type="number" [value]="userId()" (input)="userId.set(+$any($event.target).value)" min="1" max="10">
    @if (posts()) { <p>Posts: {{ posts()!.length }}</p> }
  `
})
export class Ex15 {
  http = inject(HttpClient);
  userId = signal(1);
  posts = toSignal(
    new Observable(obs => {
      obs.next(this.userId());
    }).pipe(
      switchMap(id => this.http.get<unknown[]>(`${API}/posts?userId=${id}`))
    ),
    { initialValue: null }
  );
}

// ── Ex16 – toSignal with HTTP ────────────────────────────────────────────────
@Component({
  selector: 'ex-16', standalone: true, imports: [CommonModule],
  providers: [provideHttpClient()],
  template: `
    @if (post()) { <pre>{{ post() | json }}</pre> }
    @else { <p>Loading…</p> }
  `
})
export class Ex16 {
  http = inject(HttpClient);
  post = toSignal(this.http.get(`${API}/posts/2`), { initialValue: null });
}

// ── Ex17 – async pipe with HTTP ──────────────────────────────────────────────
@Component({
  selector: 'ex-17', standalone: true, imports: [AsyncPipe, CommonModule],
  providers: [provideHttpClient()],
  template: `
    @if (post$ | async; as post) { <pre>{{ post | json }}</pre> }
    @else { <p>Loading…</p> }
  `
})
export class Ex17 {
  http = inject(HttpClient);
  post$ = this.http.get(`${API}/posts/3`);
}

// ── Ex18 – HTTP in service ───────────────────────────────────────────────────
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PostService18 {
  private http = inject(HttpClient);
  getPost(id: number) { return this.http.get<{ id: number; title: string }>(`${API}/posts/${id}`); }
}

@Component({
  selector: 'ex-18', standalone: true, imports: [CommonModule],
  providers: [provideHttpClient()],
  template: `
    <button (click)="load()">Load via Service</button>
    @if (post) { <p>{{ post.title }}</p> }
  `
})
export class Ex18 {
  svc = inject(PostService18);
  post: { id: number; title: string } | null = null;
  load() { this.svc.getPost(4).subscribe(p => (this.post = p)); }
}

// ── Ex19 – type-safe response ────────────────────────────────────────────────
interface Post19 { id: number; userId: number; title: string; body: string; }

@Component({
  selector: 'ex-19', standalone: true, imports: [CommonModule],
  providers: [provideHttpClient()],
  template: `
    <button (click)="load()">Type-safe GET</button>
    @if (post) { <p>{{ post.title }}</p> }
  `
})
export class Ex19 {
  http = inject(HttpClient);
  post: Post19 | null = null;
  load() { this.http.get<Post19>(`${API}/posts/5`).subscribe(p => (this.post = p)); }
}

// ── Ex20 – pagination ────────────────────────────────────────────────────────
@Component({
  selector: 'ex-20', standalone: true, imports: [CommonModule],
  providers: [provideHttpClient()],
  template: `
    <button (click)="prev()">Prev</button> Page {{ page() }} <button (click)="next()">Next</button>
    @for (p of posts(); track p.id) { <div>{{ p.id }}. {{ p.title }}</div> }
  `
})
export class Ex20 {
  http = inject(HttpClient);
  page = signal(1);
  posts = signal<{ id: number; title: string }[]>([]);
  constructor() { this.loadPage(); }
  loadPage() {
    const params = new HttpParams().set('_page', this.page()).set('_limit', '3');
    this.http.get<{ id: number; title: string }[]>(`${API}/posts`, { params })
      .subscribe(d => this.posts.set(d));
  }
  prev() { if (this.page() > 1) { this.page.update(p => p - 1); this.loadPage(); } }
  next() { this.page.update(p => p + 1); this.loadPage(); }
}

// ── Ex21 – search debounce ────────────────────────────────────────────────────
@Component({
  selector: 'ex-21', standalone: true, imports: [CommonModule],
  providers: [provideHttpClient()],
  template: `
    <input (input)="search$.next($any($event.target).value)" placeholder="Search posts…">
    @for (p of results(); track p.id) { <div>{{ p.title }}</div> }
  `
})
export class Ex21 {
  http = inject(HttpClient);
  search$ = new Subject<string>();
  results = toSignal(
    this.search$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(q => q ? this.http.get<{ id: number; title: string }[]>(`${API}/posts?title_like=${q}`) : of([]))
    ),
    { initialValue: [] }
  );
}

// ── Ex22 – cache with shareReplay ────────────────────────────────────────────
@Component({
  selector: 'ex-22', standalone: true, imports: [AsyncPipe, CommonModule],
  providers: [provideHttpClient()],
  template: `
    <button (click)="sub1()">Subscribe A</button>
    <button (click)="sub2()">Subscribe B (cached)</button>
    <p>Requests sent: {{ requests }}</p>
  `
})
export class Ex22 {
  http = inject(HttpClient);
  requests = 0;
  private cache$ = this.http.get(`${API}/posts/1`).pipe(
    tap(() => this.requests++),
    shareReplay(1)
  );
  sub1() { this.cache$.subscribe(); }
  sub2() { this.cache$.subscribe(); }
}

// ── Ex23 – interceptor usage (simulated) ────────────────────────────────────
@Component({
  selector: 'ex-23', standalone: true,
  providers: [provideHttpClient()],
  template: `
    <p>Interceptors are configured at bootstrap. This demo simulates logging.</p>
    <button (click)="load()">Fetch (log in console)</button>
    <p>{{ status }}</p>
  `
})
export class Ex23 {
  http = inject(HttpClient);
  status = '';
  load() {
    console.log('[Ex23 interceptor-sim] Before request');
    this.http.get(`${API}/posts/1`).pipe(
      tap(() => console.log('[Ex23 interceptor-sim] Response received'))
    ).subscribe(() => (this.status = 'Done'));
  }
}

// ── Ex24 – upload (simulated with FormData) ───────────────────────────────────
@Component({
  selector: 'ex-24', standalone: true,
  providers: [provideHttpClient()],
  template: `
    <input type="file" (change)="onFile($event)">
    <button (click)="upload()" [disabled]="!file">Upload</button>
    <p>{{ status }}</p>
  `
})
export class Ex24 {
  http = inject(HttpClient);
  file: File | null = null;
  status = '';
  onFile(e: Event) { this.file = (e.target as HTMLInputElement).files?.[0] ?? null; }
  upload() {
    if (!this.file) return;
    const fd = new FormData();
    fd.append('file', this.file);
    // JSONPlaceholder doesn't support upload — simulate
    this.status = `Would upload: ${this.file.name} (${this.file.size} bytes)`;
  }
}

// ── Ex25 – download (blob) ───────────────────────────────────────────────────
@Component({
  selector: 'ex-25', standalone: true,
  providers: [provideHttpClient()],
  template: `
    <button (click)="download()">Download JSON</button>
    <p>{{ status }}</p>
  `
})
export class Ex25 {
  http = inject(HttpClient);
  status = '';
  download() {
    this.http.get(`${API}/posts/1`, { responseType: 'blob' }).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'post.json'; a.click();
      URL.revokeObjectURL(url);
      this.status = 'Downloaded!';
    });
  }
}

// ── Ex26 – progress events ───────────────────────────────────────────────────
@Component({
  selector: 'ex-26', standalone: true,
  providers: [provideHttpClient()],
  template: `
    <button (click)="load()">GET with observe: events</button>
    <p>{{ status }}</p>
  `
})
export class Ex26 {
  http = inject(HttpClient);
  status = '';
  load() {
    this.http.get(`${API}/posts`, { observe: 'events', reportProgress: true }).subscribe(event => {
      this.status = `Event type: ${event.type}`;
    });
  }
}

// ── Ex27 – HTTP with signals ──────────────────────────────────────────────────
@Component({
  selector: 'ex-27', standalone: true, imports: [CommonModule],
  providers: [provideHttpClient()],
  template: `
    <button (click)="postId.update(id => id + 1)">Next Post</button>
    <p>ID: {{ postId() }} | Title: {{ title() }}</p>
  `
})
export class Ex27 {
  http = inject(HttpClient);
  postId = signal(1);
  title = signal('');
  constructor() {
    // Re-fetch whenever postId changes
    let prevId = 0;
    setInterval(() => {
      const id = this.postId();
      if (id !== prevId) {
        prevId = id;
        this.http.get<{ title: string }>(`${API}/posts/${id}`).subscribe(p => this.title.set(p.title));
      }
    }, 200);
  }
}

// ── Ex28 – resource-based HTTP (signal-driven) ────────────────────────────────
@Component({
  selector: 'ex-28', standalone: true, imports: [CommonModule],
  providers: [provideHttpClient()],
  template: `
    <button (click)="id.update(n => n + 1)">Next</button>
    <p>Post #{{ id() }}: {{ title() }}</p>
  `
})
export class Ex28 {
  http = inject(HttpClient);
  id = signal(1);
  title = signal('loading…');
  constructor() {
    // Simulate resource() with effect + HTTP
    let last = 0;
    setInterval(() => {
      const curr = this.id();
      if (curr !== last) {
        last = curr;
        this.http.get<{ title: string }>(`${API}/posts/${curr}`)
          .subscribe(p => this.title.set(p.title));
      }
    }, 150);
  }
}

// ── Ex29 – httpResource pattern (CRUD service) ───────────────────────────────
@Injectable({ providedIn: 'root' })
export class CrudService29 {
  private http = inject(HttpClient);
  getAll() { return this.http.get<{ id: number; title: string }[]>(`${API}/posts?_limit=5`); }
  create(body: object) { return this.http.post<{ id: number }>(`${API}/posts`, body); }
  delete(id: number) { return this.http.delete(`${API}/posts/${id}`); }
}

@Component({
  selector: 'ex-29', standalone: true, imports: [CommonModule],
  providers: [provideHttpClient()],
  template: `
    <button (click)="load()">Load</button>
    <button (click)="add()">Add</button>
    @for (p of items(); track p.id) {
      <div>{{ p.title }} <button (click)="del(p.id)">×</button></div>
    }
  `
})
export class Ex29 {
  svc = inject(CrudService29);
  items = signal<{ id: number; title: string }[]>([]);
  load() { this.svc.getAll().subscribe(d => this.items.set(d)); }
  add() { this.svc.create({ title: 'New', body: '', userId: 1 }).subscribe(r => this.items.update(i => [...i, { id: r.id, title: 'New' }])); }
  del(id: number) { this.items.update(i => i.filter(p => p.id !== id)); }
}

// ── Ex30 – optimistic update ──────────────────────────────────────────────────
@Component({
  selector: 'ex-30', standalone: true, imports: [CommonModule],
  providers: [provideHttpClient()],
  template: `
    <button (click)="load()">Load posts</button>
    @for (p of posts(); track p.id) {
      <div>
        {{ p.title }}
        <button (click)="deleteOptimistic(p.id)">Delete (optimistic)</button>
      </div>
    }
  `
})
export class Ex30 {
  http = inject(HttpClient);
  posts = signal<{ id: number; title: string }[]>([]);
  load() {
    this.http.get<{ id: number; title: string }[]>(`${API}/posts?_limit=5`)
      .subscribe(d => this.posts.set(d));
  }
  deleteOptimistic(id: number) {
    const prev = this.posts();
    this.posts.update(ps => ps.filter(p => p.id !== id));
    this.http.delete(`${API}/posts/${id}`).pipe(
      catchError(() => { this.posts.set(prev); return EMPTY; })
    ).subscribe();
  }
}

// ── Ex31 – race condition prevention with switchMap ───────────────────────────
@Component({
  selector: 'ex-31', standalone: true, imports: [CommonModule],
  providers: [provideHttpClient()],
  template: `
    <input type="number" (input)="id$.next(+$any($event.target).value)" min="1" max="100" value="1">
    @if (post()) { <p>{{ post()!.title }}</p> }
  `
})
export class Ex31 {
  http = inject(HttpClient);
  id$ = new Subject<number>();
  post = toSignal(
    this.id$.pipe(
      debounceTime(300),
      switchMap(id => this.http.get<{ title: string }>(`${API}/posts/${id}`))
    ),
    { initialValue: null }
  );
}

// ── Ex32 – environment URLs ───────────────────────────────────────────────────
const ENV = { apiUrl: 'https://jsonplaceholder.typicode.com', production: false };

@Component({
  selector: 'ex-32', standalone: true, imports: [CommonModule],
  providers: [provideHttpClient()],
  template: `
    <button (click)="load()">Load from ENV url</button>
    @if (data) { <p>{{ data }}</p> }
  `
})
export class Ex32 {
  http = inject(HttpClient);
  data = '';
  load() {
    this.http.get<{ title: string }>(`${ENV.apiUrl}/posts/1`)
      .subscribe(p => (this.data = p.title));
  }
}

// ── Ex33 – response with observe: 'response' ─────────────────────────────────
@Component({
  selector: 'ex-33', standalone: true,
  providers: [provideHttpClient()],
  template: `
    <button (click)="load()">GET full response</button>
    <p>Status: {{ status }} | Content-Type: {{ ct }}</p>
  `
})
export class Ex33 {
  http = inject(HttpClient);
  status = 0;
  ct = '';
  load() {
    this.http.get(`${API}/posts/1`, { observe: 'response' }).subscribe(res => {
      this.status = res.status;
      this.ct = res.headers.get('Content-Type') ?? 'n/a';
    });
  }
}

// ── Ex34 – GET list with map transform ───────────────────────────────────────
@Component({
  selector: 'ex-34', standalone: true, imports: [CommonModule],
  providers: [provideHttpClient()],
  template: `
    <button (click)="load()">Load titles</button>
    @for (t of titles(); track t) { <li>{{ t }}</li> }
  `
})
export class Ex34 {
  http = inject(HttpClient);
  titles = signal<string[]>([]);
  load() {
    this.http.get<{ title: string }[]>(`${API}/posts?_limit=5`).pipe(
      map(posts => posts.map(p => p.title))
    ).subscribe(t => this.titles.set(t));
  }
}

// ── Ex35 – chained HTTP calls ────────────────────────────────────────────────
@Component({
  selector: 'ex-35', standalone: true, imports: [CommonModule],
  providers: [provideHttpClient()],
  template: `
    <button (click)="load()">Get user's posts</button>
    @if (info) { <pre>{{ info | json }}</pre> }
  `
})
export class Ex35 {
  http = inject(HttpClient);
  info: unknown = null;
  load() {
    this.http.get<{ id: number; username: string }>(`${API}/users/1`).pipe(
      switchMap(user => this.http.get<unknown[]>(`${API}/posts?userId=${user.id}`).pipe(
        map(posts => ({ user: user.username, postCount: posts.length }))
      ))
    ).subscribe(d => (this.info = d));
  }
}

// ── Ex36 – error message display ─────────────────────────────────────────────
@Component({
  selector: 'ex-36', standalone: true,
  providers: [provideHttpClient()],
  template: `
    <button (click)="load()">GET with error display</button>
    @if (error()) { <p style="color:red">{{ error() }}</p> }
    @if (data()) { <p>{{ data() }}</p> }
  `
})
export class Ex36 {
  http = inject(HttpClient);
  error = signal('');
  data = signal('');
  load() {
    this.error.set('');
    this.http.get<{ title: string }>(`${API}/posts/1`).pipe(
      catchError(err => {
        this.error.set(`HTTP ${err.status}: ${err.message}`);
        return EMPTY;
      })
    ).subscribe(p => this.data.set(p.title));
  }
}

// ── Ex37 – concurrent requests with Promise.all style ────────────────────────
@Component({
  selector: 'ex-37', standalone: true, imports: [CommonModule],
  providers: [provideHttpClient()],
  template: `
    <button (click)="loadAll()">Load all parallel</button>
    @if (results) { <pre>{{ results | json }}</pre> }
  `
})
export class Ex37 {
  http = inject(HttpClient);
  results: unknown = null;
  loadAll() {
    forkJoin([1, 2, 3].map(id => this.http.get(`${API}/posts/${id}`))).subscribe(r => (this.results = r));
  }
}

// ── Ex38 – tap for side effects in pipeline ───────────────────────────────────
@Component({
  selector: 'ex-38', standalone: true, imports: [CommonModule],
  providers: [provideHttpClient()],
  template: `
    <button (click)="load()">Fetch with tap logging</button>
    @if (data) { <p>{{ data }}</p> }
    <p>Log: {{ log | json }}</p>
  `
})
export class Ex38 {
  http = inject(HttpClient);
  data = '';
  log: string[] = [];
  load() {
    this.http.get<{ title: string }>(`${API}/posts/1`).pipe(
      tap(d => this.log.push(`Received: ${d.title.slice(0, 20)}`)),
      map(d => d.title)
    ).subscribe(t => (this.data = t));
  }
}

// ── Ex39 – GET array and display with @for ────────────────────────────────────
@Component({
  selector: 'ex-39', standalone: true, imports: [CommonModule],
  providers: [provideHttpClient()],
  template: `
    <button (click)="load()">Load users</button>
    @for (u of users(); track u.id) { <div>{{ u.name }} — {{ u.email }}</div> }
  `
})
export class Ex39 {
  http = inject(HttpClient);
  users = signal<{ id: number; name: string; email: string }[]>([]);
  load() {
    this.http.get<{ id: number; name: string; email: string }[]>(`${API}/users`)
      .subscribe(u => this.users.set(u));
  }
}

// ── Ex40 – POST and update local list ────────────────────────────────────────
@Component({
  selector: 'ex-40', standalone: true, imports: [CommonModule, FormsModule],
  providers: [provideHttpClient()],
  template: `
    <input [(ngModel)]="title" placeholder="Post title">
    <button (click)="submit()">Create Post</button>
    @for (p of created(); track p.id) { <div>{{ p.title }}</div> }
  `
})
export class Ex40 {
  http = inject(HttpClient);
  title = '';
  created = signal<{ id: number; title: string }[]>([]);
  submit() {
    this.http.post<{ id: number; title: string }>(`${API}/posts`, { title: this.title, userId: 1 })
      .subscribe(p => { this.created.update(list => [p, ...list]); this.title = ''; });
  }
}

// ── Ex41 – DELETE with confirmation ──────────────────────────────────────────
@Component({
  selector: 'ex-41', standalone: true, imports: [CommonModule],
  providers: [provideHttpClient()],
  template: `
    <button (click)="load()">Load</button>
    @for (p of posts(); track p.id) {
      <div>{{ p.title }} <button (click)="confirmDelete(p.id)">Delete</button></div>
    }
    <p>{{ status }}</p>
  `
})
export class Ex41 {
  http = inject(HttpClient);
  posts = signal<{ id: number; title: string }[]>([]);
  status = '';
  load() { this.http.get<{ id: number; title: string }[]>(`${API}/posts?_limit=3`).subscribe(d => this.posts.set(d)); }
  confirmDelete(id: number) {
    if (confirm(`Delete post ${id}?`)) {
      this.http.delete(`${API}/posts/${id}`).subscribe(() => {
        this.posts.update(ps => ps.filter(p => p.id !== id));
        this.status = `Deleted ${id}`;
      });
    }
  }
}

// ── Ex42 – HTTP status code handling ─────────────────────────────────────────
@Component({
  selector: 'ex-42', standalone: true,
  providers: [provideHttpClient()],
  template: `
    <button (click)="load()">Test 200 response</button>
    <p>{{ msg }}</p>
  `
})
export class Ex42 {
  http = inject(HttpClient);
  msg = '';
  load() {
    this.http.get(`${API}/posts/1`, { observe: 'response' }).subscribe(res => {
      this.msg = res.ok ? `200 OK: ${res.statusText}` : `Not OK: ${res.status}`;
    });
  }
}

// ── Ex43 – HTTP with signal-based id selector ─────────────────────────────────
@Component({
  selector: 'ex-43', standalone: true, imports: [CommonModule],
  providers: [provideHttpClient()],
  template: `
    <select (change)="selected.set(+$any($event.target).value)">
      @for (id of ids; track id) { <option [value]="id">Post {{ id }}</option> }
    </select>
    @if (post()) { <p>{{ post()!.title }}</p> }
  `
})
export class Ex43 {
  http = inject(HttpClient);
  ids = [1, 2, 3, 4, 5];
  selected = signal(1);
  post = toSignal(
    new BehaviorSubject(1).pipe(
      switchMap(id => this.http.get<{ title: string }>(`${API}/posts/${id}`))
    ),
    { initialValue: null }
  );
}

// ── Ex44 – retry with delay (manual) ─────────────────────────────────────────
@Component({
  selector: 'ex-44', standalone: true,
  providers: [provideHttpClient()],
  template: `
    <button (click)="load()">Fetch with retry delay</button>
    <p>{{ status }}</p>
  `
})
export class Ex44 {
  http = inject(HttpClient);
  status = '';
  load() {
    this.http.get(`${API}/posts/1`).pipe(
      retry({ count: 2, delay: 1000 }),
      catchError(() => { this.status = 'Failed'; return EMPTY; })
    ).subscribe(() => (this.status = 'Loaded'));
  }
}

// ── Ex45 – conditional GET ───────────────────────────────────────────────────
@Component({
  selector: 'ex-45', standalone: true,
  providers: [provideHttpClient()],
  template: `
    <button (click)="toggle()">{{ show() ? 'Hide' : 'Show' }} Data</button>
    @if (show()) {
      @if (data()) { <p>{{ data() }}</p> } @else { <p>Loading…</p> }
    }
  `
})
export class Ex45 {
  http = inject(HttpClient);
  show = signal(false);
  data = signal('');
  toggle() {
    this.show.update(v => !v);
    if (this.show() && !this.data()) {
      this.http.get<{ title: string }>(`${API}/posts/1`)
        .subscribe(p => this.data.set(p.title));
    }
  }
}

// ── Ex46 – HTTP with finalize ────────────────────────────────────────────────
@Component({
  selector: 'ex-46', standalone: true,
  providers: [provideHttpClient()],
  template: `
    <button (click)="load()" [disabled]="busy()">{{ busy() ? '…' : 'Fetch' }}</button>
    <p>{{ data() }}</p>
  `
})
export class Ex46 {
  http = inject(HttpClient);
  busy = signal(false);
  data = signal('');
  load() {
    this.busy.set(true);
    this.http.get<{ title: string }>(`${API}/posts/1`).pipe(
      finalize(() => this.busy.set(false))
    ).subscribe(p => this.data.set(p.title));
  }
}

// ── Ex47 – GET with startWith loading placeholder ────────────────────────────
@Component({
  selector: 'ex-47', standalone: true, imports: [AsyncPipe],
  providers: [provideHttpClient()],
  template: `
    <p>{{ data$ | async }}</p>
    <button (click)="refresh()">Refresh</button>
  `
})
export class Ex47 {
  http = inject(HttpClient);
  private trigger$ = new BehaviorSubject<void>(undefined);
  data$ = this.trigger$.pipe(
    switchMap(() =>
      this.http.get<{ title: string }>(`${API}/posts/1`).pipe(
        map(p => p.title),
        startWith('Loading…')
      )
    )
  );
  refresh() { this.trigger$.next(); }
}

// ── Ex48 – batch DELETE ───────────────────────────────────────────────────────
@Component({
  selector: 'ex-48', standalone: true,
  providers: [provideHttpClient()],
  template: `
    <button (click)="deleteAll()">Delete posts 1–3</button>
    <p>{{ status }}</p>
  `
})
export class Ex48 {
  http = inject(HttpClient);
  status = '';
  deleteAll() {
    forkJoin([1, 2, 3].map(id => this.http.delete(`${API}/posts/${id}`))).subscribe({
      next: () => (this.status = 'All deleted'),
      error: () => (this.status = 'Some failed')
    });
  }
}

// ── Ex49 – GET with map + filter transform ────────────────────────────────────
@Component({
  selector: 'ex-49', standalone: true, imports: [CommonModule],
  providers: [provideHttpClient()],
  template: `
    <button (click)="load()">Load long-title posts</button>
    @for (t of titles(); track t) { <li>{{ t }}</li> }
  `
})
export class Ex49 {
  http = inject(HttpClient);
  titles = signal<string[]>([]);
  load() {
    this.http.get<{ title: string }[]>(`${API}/posts?_limit=20`).pipe(
      map(posts => posts.map(p => p.title).filter(t => t.length > 40))
    ).subscribe(t => this.titles.set(t));
  }
}

// ── Ex50 – full CRUD component ────────────────────────────────────────────────
@Component({
  selector: 'ex-50', standalone: true, imports: [CommonModule, FormsModule],
  providers: [provideHttpClient()],
  template: `
    <input [(ngModel)]="newTitle" placeholder="New post title">
    <button (click)="create()">Create</button>
    <button (click)="loadAll()">Reload</button>
    @for (p of posts(); track p.id) {
      <div>
        <strong>{{ p.id }}</strong>: {{ p.title }}
        <button (click)="update(p.id)">Update</button>
        <button (click)="remove(p.id)">Delete</button>
      </div>
    }
  `
})
export class Ex50 {
  http = inject(HttpClient);
  posts = signal<{ id: number; title: string }[]>([]);
  newTitle = '';
  constructor() { this.loadAll(); }
  loadAll() {
    this.http.get<{ id: number; title: string }[]>(`${API}/posts?_limit=5`)
      .subscribe(d => this.posts.set(d));
  }
  create() {
    this.http.post<{ id: number; title: string }>(`${API}/posts`, { title: this.newTitle, userId: 1 })
      .subscribe(p => { this.posts.update(list => [p, ...list]); this.newTitle = ''; });
  }
  update(id: number) {
    this.http.patch<{ title: string }>(`${API}/posts/${id}`, { title: 'Updated' })
      .subscribe(() => this.posts.update(ps => ps.map(p => p.id === id ? { ...p, title: 'Updated' } : p)));
  }
  remove(id: number) {
    this.http.delete(`${API}/posts/${id}`).subscribe(() =>
      this.posts.update(ps => ps.filter(p => p.id !== id))
    );
  }
}

// ── AppComponent ──────────────────────────────────────────────────────────────
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    Ex01, Ex02, Ex03, Ex04, Ex05, Ex06, Ex07, Ex08, Ex09, Ex10,
    Ex11, Ex12, Ex13, Ex14, Ex15, Ex16, Ex17, Ex18, Ex19, Ex20,
    Ex21, Ex22, Ex23, Ex24, Ex25, Ex26, Ex27, Ex28, Ex29, Ex30,
    Ex31, Ex32, Ex33, Ex34, Ex35, Ex36, Ex37, Ex38, Ex39, Ex40,
    Ex41, Ex42, Ex43, Ex44, Ex45, Ex46, Ex47, Ex48, Ex49, Ex50
  ],
  template: `
    <div style="font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px">
      <h1>Phase 3 – HTTP Client Examples</h1>

      <h4>Ex01 – HTTP GET</h4><ex-01 /><hr />
      <h4>Ex02 – HTTP POST</h4><ex-02 /><hr />
      <h4>Ex03 – HTTP PUT</h4><ex-03 /><hr />
      <h4>Ex04 – HTTP DELETE</h4><ex-04 /><hr />
      <h4>Ex05 – HTTP PATCH</h4><ex-05 /><hr />
      <h4>Ex06 – HTTP headers</h4><ex-06 /><hr />
      <h4>Ex07 – query params</h4><ex-07 /><hr />
      <h4>Ex08 – HttpParams builder</h4><ex-08 /><hr />
      <h4>Ex09 – response types</h4><ex-09 /><hr />
      <h4>Ex10 – error handling</h4><ex-10 /><hr />
      <h4>Ex11 – loading state</h4><ex-11 /><hr />
      <h4>Ex12 – retry</h4><ex-12 /><hr />
      <h4>Ex13 – timeout</h4><ex-13 /><hr />
      <h4>Ex14 – forkJoin multiple requests</h4><ex-14 /><hr />
      <h4>Ex15 – switchMap chain</h4><ex-15 /><hr />
      <h4>Ex16 – toSignal with HTTP</h4><ex-16 /><hr />
      <h4>Ex17 – async pipe with HTTP</h4><ex-17 /><hr />
      <h4>Ex18 – HTTP in service</h4><ex-18 /><hr />
      <h4>Ex19 – type-safe response</h4><ex-19 /><hr />
      <h4>Ex20 – pagination</h4><ex-20 /><hr />
      <h4>Ex21 – search debounce</h4><ex-21 /><hr />
      <h4>Ex22 – cache with shareReplay</h4><ex-22 /><hr />
      <h4>Ex23 – interceptor usage</h4><ex-23 /><hr />
      <h4>Ex24 – upload</h4><ex-24 /><hr />
      <h4>Ex25 – download</h4><ex-25 /><hr />
      <h4>Ex26 – progress events</h4><ex-26 /><hr />
      <h4>Ex27 – HTTP with signals</h4><ex-27 /><hr />
      <h4>Ex28 – resource-based HTTP</h4><ex-28 /><hr />
      <h4>Ex29 – CRUD service</h4><ex-29 /><hr />
      <h4>Ex30 – optimistic update</h4><ex-30 /><hr />
      <h4>Ex31 – race condition with switchMap</h4><ex-31 /><hr />
      <h4>Ex32 – environment URLs</h4><ex-32 /><hr />
      <h4>Ex33 – full response observe</h4><ex-33 /><hr />
      <h4>Ex34 – GET list with map transform</h4><ex-34 /><hr />
      <h4>Ex35 – chained HTTP calls</h4><ex-35 /><hr />
      <h4>Ex36 – error message display</h4><ex-36 /><hr />
      <h4>Ex37 – concurrent requests</h4><ex-37 /><hr />
      <h4>Ex38 – tap for side effects</h4><ex-38 /><hr />
      <h4>Ex39 – GET array with @for</h4><ex-39 /><hr />
      <h4>Ex40 – POST and update list</h4><ex-40 /><hr />
      <h4>Ex41 – DELETE with confirmation</h4><ex-41 /><hr />
      <h4>Ex42 – HTTP status code handling</h4><ex-42 /><hr />
      <h4>Ex43 – signal-based id selector</h4><ex-43 /><hr />
      <h4>Ex44 – retry with delay</h4><ex-44 /><hr />
      <h4>Ex45 – conditional GET</h4><ex-45 /><hr />
      <h4>Ex46 – HTTP with finalize</h4><ex-46 /><hr />
      <h4>Ex47 – startWith loading placeholder</h4><ex-47 /><hr />
      <h4>Ex48 – batch DELETE</h4><ex-48 /><hr />
      <h4>Ex49 – GET with map + filter</h4><ex-49 /><hr />
      <h4>Ex50 – full CRUD component</h4><ex-50 /><hr />
    </div>
  `
})
export class AppComponent {}
