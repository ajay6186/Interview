import { Component, Injectable, inject, signal, OnInit,
         ChangeDetectionStrategy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { JsonPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

// ============================================================
// Solution 3.3 — HttpClient
// ============================================================

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

const API = 'https://jsonplaceholder.typicode.com';

// SOLUTION 1: PostsService
@Injectable({ providedIn: 'root' })
class PostsService {
  private http = inject(HttpClient);

  getPosts()                   { return this.http.get<Post[]>(`${API}/posts?_limit=5`); }
  getPost(id: number)          { return this.http.get<Post>(`${API}/posts/${id}`); }
  createPost(data: Partial<Post>) { return this.http.post<Post>(`${API}/posts`, data); }
}

// SOLUTION 2: PostsListComponent
@Component({
  selector: 'app-posts-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Posts List (toSignal)</h3>
      @if (!posts().length) { <p>Loading...</p> }
      @for (post of posts(); track post.id) {
        <div style="margin-bottom: 8px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          <strong>#{{ post.id }}:</strong> {{ post.title }}
        </div>
      }
    </section>
  `,
})
class PostsListComponent {
  private postsService = inject(PostsService);
  posts = toSignal(this.postsService.getPosts(), { initialValue: [] as Post[] });
}

// SOLUTION 3: PostDetailComponent
@Component({
  selector: 'app-post-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Post Detail</h3>
      @if (post()) {
        <h4>{{ post()!.title }}</h4>
        <p>{{ post()!.body }}</p>
      } @else {
        <p>Loading post...</p>
      }
    </section>
  `,
})
class PostDetailComponent implements OnInit {
  private http = inject(HttpClient);
  post = signal<Post | null>(null);

  ngOnInit() {
    this.http.get<Post>(`${API}/posts/1`).subscribe(p => this.post.set(p));
  }
}

// SOLUTION 4: CreatePostComponent
@Component({
  selector: 'app-create-post',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Create Post (POST)</h3>
      <button (click)="create()">Create Post</button>
      @if (created()) {
        <pre style="background: #f4f4f4; padding: 8px; border-radius: 4px; margin-top: 8px;">{{ created() | json }}</pre>
      }
    </section>
  `,
  imports: [JsonPipe],
})
class CreatePostComponent {
  private http = inject(HttpClient);
  created = signal<Post | null>(null);

  create() {
    this.http.post<Post>(`${API}/posts`, { title: 'Test Post', body: 'Hello!', userId: 1 })
      .subscribe(p => this.created.set(p));
  }
}

// SOLUTION 5: HttpErrorComponent
@Component({
  selector: 'app-http-error',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Error Handling</h3>
      <button (click)="fetchBad()">Trigger Bad Request</button>
      @if (error()) {
        <p style="color: red; margin-top: 8px;">Error: {{ error() }}</p>
      }
    </section>
  `,
})
class HttpErrorComponent {
  private http = inject(HttpClient);
  error = signal('');

  fetchBad() {
    this.http.get(`${API}/nonexistent-endpoint-404`)
      .pipe(catchError((err: HttpErrorResponse) => {
        this.error.set(`${err.status} ${err.statusText}`);
        return of(null);
      }))
      .subscribe();
  }
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PostsListComponent, PostDetailComponent, CreatePostComponent, HttpErrorComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 3.3 — HttpClient</h1>
      <app-posts-list />
      <hr />
      <app-post-detail />
      <hr />
      <app-create-post />
      <hr />
      <app-http-error />
    </div>
  `,
})
export class AppComponent {}
