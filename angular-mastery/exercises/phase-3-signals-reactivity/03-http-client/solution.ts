import { Component, signal, OnInit, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, BehaviorSubject, combineLatest } from 'rxjs';
import {
  debounceTime, distinctUntilChanged, map, switchMap, startWith, catchError, tap,
} from 'rxjs/operators';
import { of } from 'rxjs';

// ============================================================
// Solution 3.3 — HttpClient
// ============================================================

interface Post { userId: number; id: number; title: string; body: string; }
interface User {
  id: number; name: string; email: string; phone: string; website: string;
  address: { city: string };
}

const BASE = 'https://jsonplaceholder.typicode.com';

// SOLUTION 1: PostsComponent (signals + manual subscription)
@Component({
  selector: 'app-posts',
  standalone: true,
  template: `
    @if (loading()) {
      <p style="color: gray;">⏳ Loading posts…</p>
    } @else if (error()) {
      <p style="color: red;">❌ {{ error() }}</p>
    } @else {
      @for (post of posts(); track post.id) {
        <div style="border: 1px solid #ddd; border-radius: 6px; padding: 10px; margin-bottom: 8px;">
          <strong style="color: #3498db;">{{ post.title }}</strong>
          <p style="font-size: 13px; color: #555; margin: 4px 0 0;">{{ post.body }}</p>
        </div>
      }
    }
    <button (click)="loadPosts()" [disabled]="loading()"
            style="margin-top: 8px; padding: 6px 14px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc;">
      Reload
    </button>
  `,
})
class PostsComponent implements OnInit {
  private http    = inject(HttpClient);
  posts   = signal<Post[]>([]);
  loading = signal(false);
  error   = signal('');

  ngOnInit() { this.loadPosts(); }

  loadPosts() {
    this.loading.set(true);
    this.error.set('');
    this.http.get<Post[]>(`${BASE}/posts?_limit=5`).subscribe({
      next:  (data) => { this.posts.set(data);  this.loading.set(false); },
      error: (err)  => { this.error.set(err.message); this.loading.set(false); },
    });
  }
}

// SOLUTION 2: UserDetailComponent (async pipe)
@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    @if (user$ | async; as user) {
      <div style="display: grid; grid-template-columns: auto 1fr; gap: 6px 16px;
                  border: 1px solid #dee2e6; border-radius: 8px; padding: 14px; max-width: 360px;">
        <span style="color: gray; font-size: 13px;">Name</span>       <strong>{{ user.name }}</strong>
        <span style="color: gray; font-size: 13px;">Email</span>      <span>{{ user.email }}</span>
        <span style="color: gray; font-size: 13px;">Phone</span>      <span>{{ user.phone }}</span>
        <span style="color: gray; font-size: 13px;">City</span>       <span>{{ user.address.city }}</span>
        <span style="color: gray; font-size: 13px;">Website</span>    <span>{{ user.website }}</span>
      </div>
    } @else {
      <p style="color: gray;">Loading user…</p>
    }
  `,
})
class UserDetailComponent {
  private http = inject(HttpClient);
  user$ = this.http.get<User>(`${BASE}/users/1`);
}

// SOLUTION 3: SearchUsersComponent (client-side filter)
@Component({
  selector: 'app-search-users',
  standalone: true,
  imports: [AsyncPipe, FormsModule],
  template: `
    <input [ngModel]="query" (ngModelChange)="search$.next($event)"
           placeholder="Filter users by name…"
           style="padding: 8px 12px; border-radius: 4px; border: 1px solid #ccc; width: 260px; margin-bottom: 10px;" />
    <ul style="padding-left: 20px; margin: 0;">
      @for (u of filtered$ | async; track u.id) {
        <li>{{ u.name }} — {{ u.email }}</li>
      } @empty {
        <li style="color: gray;">No users match.</li>
      }
    </ul>
  `,
})
class SearchUsersComponent {
  private http = inject(HttpClient);
  query  = '';
  search$ = new Subject<string>();

  private allUsers$ = this.http.get<User[]>(`${BASE}/users`);

  filtered$ = combineLatest([
    this.allUsers$,
    this.search$.pipe(debounceTime(200), distinctUntilChanged(), startWith('')),
  ]).pipe(
    map(([users, q]) =>
      q.trim() ? users.filter((u) => u.name.toLowerCase().includes(q.toLowerCase())) : users
    )
  );
}

// SOLUTION 4: PostFormComponent
@Component({
  selector: 'app-post-form',
  standalone: true,
  imports: [FormsModule, AsyncPipe],
  template: `
    <form (ngSubmit)="submit()" style="display: flex; flex-direction: column; gap: 8px; max-width: 360px;">
      <input [(ngModel)]="form.title" name="title" placeholder="Post title"
             style="padding: 8px; border-radius: 4px; border: 1px solid #ccc;" />
      <textarea [(ngModel)]="form.body" name="body" rows="3" placeholder="Post body"
                style="padding: 8px; border-radius: 4px; border: 1px solid #ccc; resize: vertical;"></textarea>
      <button type="submit" [disabled]="loading()"
              style="padding: 8px 16px; background: #3498db; color: white;
                     border: none; border-radius: 4px; cursor: pointer;">
        {{ loading() ? 'Posting…' : 'Submit Post' }}
      </button>
    </form>
    @if (response()) {
      <div style="margin-top: 10px; background: #d4edda; padding: 10px; border-radius: 6px; font-size: 13px;">
        ✅ Created post with id: <strong>{{ response()!.id }}</strong>
      </div>
    }
    @if (error()) {
      <p style="color: red; margin-top: 8px;">❌ {{ error() }}</p>
    }
  `,
})
class PostFormComponent {
  private http = inject(HttpClient);
  form     = { title: '', body: '' };
  loading  = signal(false);
  error    = signal('');
  response = signal<Post | null>(null);

  submit() {
    if (!this.form.title.trim()) return;
    this.loading.set(true);
    this.error.set('');
    this.http.post<Post>(`${BASE}/posts`, { ...this.form, userId: 1 }).subscribe({
      next:  (res) => { this.response.set(res); this.loading.set(false); },
      error: (err) => { this.error.set(err.message); this.loading.set(false); },
    });
  }
}

// SOLUTION 5: HttpParamsComponent
@Component({
  selector: 'app-http-params',
  standalone: true,
  imports: [AsyncPipe, FormsModule],
  template: `
    <label>Limit:
      <select [(ngModel)]="limit" (ngModelChange)="load()"
              style="margin-left: 8px; padding: 4px 8px; border-radius: 4px; border: 1px solid #ccc;">
        <option [value]="3">3</option>
        <option [value]="5">5</option>
        <option [value]="10">10</option>
      </select>
    </label>
    <ul style="padding-left: 20px; margin-top: 10px; font-size: 14px;">
      @for (p of posts(); track p.id) {
        <li>{{ p.title }}</li>
      }
    </ul>
  `,
})
class HttpParamsComponent implements OnInit {
  private http = inject(HttpClient);
  limit = 3;
  posts = signal<Post[]>([]);

  ngOnInit() { this.load(); }

  load() {
    const params = new HttpParams().set('_limit', String(this.limit)).set('userId', '1');
    this.http.get<Post[]>(`${BASE}/posts`, { params }).subscribe((data) => this.posts.set(data));
  }
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PostsComponent, UserDetailComponent, SearchUsersComponent, PostFormComponent, HttpParamsComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <h1>Solution 3.3 — HttpClient</h1>

      <h2>1. GET list (signals + manual subscribe)</h2>
      <app-posts />
      <hr />

      <h2>2. GET single user (async pipe)</h2>
      <app-user-detail />
      <hr />

      <h2>3. Client-side search (combineLatest)</h2>
      <app-search-users />
      <hr />

      <h2>4. POST a new item</h2>
      <app-post-form />
      <hr />

      <h2>5. HttpParams (dynamic query params)</h2>
      <app-http-params />
    </div>
  `,
})
export class AppComponent {}
