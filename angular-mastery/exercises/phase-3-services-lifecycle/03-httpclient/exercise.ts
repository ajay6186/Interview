import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// ============================================================
// Exercise 3.3 — HttpClient
// ============================================================
// Topics:
//   • HttpClient GET / POST
//   • provideHttpClient (configured in main.ts)
//   • toSignal() for converting Observables to Signals
//   • Loading and error states
//   • Error handling with catchError
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: PostsService
// ---------------------------------------------------------------------------
// Create a PostsService decorated with @Injectable({ providedIn: 'root' }).
// Inject HttpClient using inject(HttpClient).
// Method: getPosts() — GET https://jsonplaceholder.typicode.com/posts?_limit=5
//   Returns Observable<Post[]>.
// Method: getPost(id: number) — GET .../posts/:id. Returns Observable<Post>.
// Method: createPost(data: Partial<Post>) — POST to /posts. Returns Observable<Post>.
//
// interface Post { id: number; title: string; body: string; userId: number; }
//
// @Injectable({ providedIn: 'root' })
// export class PostsService { ... }

// ---------------------------------------------------------------------------
// TODO 2: PostsListComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-posts-list'.
// Inject PostsService. Use toSignal(postsService.getPosts(), { initialValue: [] })
// to get a posts signal.
// Also track a loading signal (set to false once toSignal resolves).
// Display the list with @for. Show "Loading..." while loading.
//
// @Component({ selector: 'app-posts-list', standalone: true, ... })
// export class PostsListComponent { ... }

// ---------------------------------------------------------------------------
// TODO 3: PostDetailComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-post-detail'.
// Fetch /posts/1 in ngOnInit using HttpClient directly (inject it).
// Store the result in a `post` signal.
// Display post title and body.
//
// @Component({ selector: 'app-post-detail', standalone: true, ... })
// export class PostDetailComponent { ... }

// ---------------------------------------------------------------------------
// TODO 4: CreatePostComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-create-post'.
// Inject HttpClient.
// On button click, POST { title: 'Test Post', body: 'Hello!', userId: 1 }
// to https://jsonplaceholder.typicode.com/posts.
// Display the server response (the new post with its id).
//
// @Component({ selector: 'app-create-post', standalone: true, ... })
// export class CreatePostComponent { ... }

// ---------------------------------------------------------------------------
// TODO 5: HttpErrorComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-http-error'.
// Inject HttpClient.
// Fetch from https://jsonplaceholder.typicode.com/nonexistent-url.
// Use catchError to catch the error and set an error signal message.
// Display the error message in the template.
//
// @Component({ selector: 'app-http-error', standalone: true, ... })
// export class HttpErrorComponent { ... }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO: Add all exercise components
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 3.3 — HttpClient</h1>
      <!-- TODO: render all components -->
    </div>
  `,
})
export class AppComponent {}
