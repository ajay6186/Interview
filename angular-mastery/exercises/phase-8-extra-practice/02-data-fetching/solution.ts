import { Component, inject, signal, OnInit, OnDestroy,
         ElementRef, ViewChild, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timer, Subject, Subscription, forkJoin } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// ============================================================
// Solution 8.2 — Data Fetching Patterns
// ============================================================

const API = 'https://jsonplaceholder.typicode.com';
interface Post { id: number; title: string; body: string; }
interface User { id: number; name: string; email: string; }

// SOLUTION 1: Simple HTTP with loading/error
@Component({
  selector: 'app-simple-http',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Simple HTTP Fetch</h3>
      @if (loading()) { <p>Loading...</p> }
      @if (error()) { <p style="color:red">{{ error() }}</p> }
      @for (post of posts(); track post.id) {
        <div style="padding:4px 0;border-bottom:1px solid #eee;font-size:0.9rem;">{{ post.title }}</div>
      }
      <button (click)="load()" style="margin-top:8px">Reload</button>
    </section>
  `,
})
class SimpleHttpComponent implements OnInit {
  private http = inject(HttpClient);
  loading = signal(false);
  error   = signal('');
  posts   = signal<Post[]>([]);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true); this.error.set('');
    this.http.get<Post[]>(`${API}/posts?_limit=10`).subscribe({
      next:  p => { this.posts.set(p); this.loading.set(false); },
      error: e => { this.error.set(e.message); this.loading.set(false); },
    });
  }
}

// SOLUTION 2: Infinite scroll
@Component({
  selector: 'app-infinite-scroll',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Infinite Scroll</h3>
      <div style="max-height:200px;overflow-y:auto;" #container>
        @for (post of posts(); track post.id) {
          <div style="padding:4px 0;border-bottom:1px solid #eee;font-size:0.9rem;">{{ post.title }}</div>
        }
        @if (loading()) { <p>Loading more...</p> }
        <div #sentinel style="height:1px;"></div>
      </div>
    </section>
  `,
})
class InfiniteScrollComponent implements AfterViewInit, OnDestroy {
  @ViewChild('sentinel') sentinel!: ElementRef;
  private http     = inject(HttpClient);
  posts   = signal<Post[]>([]);
  loading = signal(false);
  private page = 1;
  private observer!: IntersectionObserver;

  ngAfterViewInit() {
    this.loadMore();
    this.observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !this.loading()) this.loadMore();
    });
    this.observer.observe(this.sentinel.nativeElement);
  }

  loadMore() {
    if (this.page > 4) return;
    this.loading.set(true);
    this.http.get<Post[]>(`${API}/posts?_page=${this.page}&_limit=5`).subscribe(posts => {
      this.posts.update(p => [...p, ...posts]);
      this.loading.set(false);
      this.page++;
    });
  }

  ngOnDestroy() { this.observer?.disconnect(); }
}

// SOLUTION 3: Polling
@Component({
  selector: 'app-refresh',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Polling (every 5s)</h3>
      <p>Last refresh: {{ lastRefresh() }}</p>
      <p>{{ status() }}</p>
      <button (click)="toggle()">{{ running() ? 'Stop' : 'Start' }} Polling</button>
    </section>
  `,
})
class RefreshComponent implements OnInit, OnDestroy {
  private http    = inject(HttpClient);
  lastRefresh     = signal('');
  status          = signal('');
  running         = signal(true);
  private stop$   = new Subject<void>();
  private sub?: Subscription;

  ngOnInit()    { this.startPolling(); }
  ngOnDestroy() { this.stop$.next(); }

  startPolling() {
    this.sub = timer(0, 5000).pipe(
      takeUntil(this.stop$),
      switchMap(() => this.http.get<Post>(`${API}/posts/1`)),
    ).subscribe(post => {
      this.lastRefresh.set(new Date().toLocaleTimeString());
      this.status.set(post.title);
    });
  }

  toggle() {
    if (this.running()) { this.stop$.next(); this.running.set(false); }
    else { this.stop$ = new Subject(); this.running.set(true); this.startPolling(); }
  }
}

// SOLUTION 4: Parallel fetch
@Component({
  selector: 'app-parallel-fetch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Parallel forkJoin</h3>
      <button (click)="fetchAll()" [disabled]="loading()">Fetch Posts + Users</button>
      @if (loading()) { <p>Loading in parallel...</p> }
      @if (posts().length) {
        <p><strong>Posts:</strong> {{ posts().map(p => p.title.slice(0,30)).join(' | ') }}</p>
        <p><strong>Users:</strong> {{ users().map(u => u.name).join(', ') }}</p>
      }
    </section>
  `,
})
class ParallelFetchComponent {
  private http = inject(HttpClient);
  loading = signal(false);
  posts   = signal<Post[]>([]);
  users   = signal<User[]>([]);

  fetchAll() {
    this.loading.set(true);
    forkJoin([
      this.http.get<Post[]>(`${API}/posts?_limit=3`),
      this.http.get<User[]>(`${API}/users?_limit=3`),
    ]).subscribe(([posts, users]) => {
      this.posts.set(posts); this.users.set(users); this.loading.set(false);
    });
  }
}

// SOLUTION 5: Paginated
@Component({
  selector: 'app-paginated',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Paginated Posts</h3>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <button (click)="prev()" [disabled]="page() === 1">← Prev</button>
        <span>Page {{ page() }}</span>
        <button (click)="next()">Next →</button>
      </div>
      @for (post of posts(); track post.id) {
        <div style="padding:4px 0;border-bottom:1px solid #eee;font-size:0.9rem;">{{ post.title }}</div>
      }
    </section>
  `,
})
class PaginatedComponent implements OnInit {
  private http = inject(HttpClient);
  page  = signal(1);
  posts = signal<Post[]>([]);

  ngOnInit() { this.load(); }
  prev()     { if (this.page() > 1) { this.page.update(p => p - 1); this.load(); } }
  next()     { this.page.update(p => p + 1); this.load(); }

  load() {
    this.http.get<Post[]>(`${API}/posts?_page=${this.page()}&_limit=5`)
      .subscribe(p => this.posts.set(p));
  }
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SimpleHttpComponent, InfiniteScrollComponent, RefreshComponent,
            ParallelFetchComponent, PaginatedComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 8.2 — Data Fetching</h1>
      <app-simple-http /><hr />
      <app-infinite-scroll /><hr />
      <app-refresh /><hr />
      <app-parallel-fetch /><hr />
      <app-paginated />
    </div>
  `,
})
export class AppComponent {}
