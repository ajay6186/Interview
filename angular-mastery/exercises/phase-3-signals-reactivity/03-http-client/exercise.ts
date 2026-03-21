import { Component } from '@angular/core';

// ============================================================
// Exercise 3.3 — HttpClient
// ============================================================
// Topics:
//   • provideHttpClient() in appConfig
//   • inject(HttpClient) — functional injection
//   • http.get<T>(url) returns Observable<T>
//   • Handling loading / error / success states
//   • HttpParams, HttpHeaders for query params and headers
//   • Interceptors: withInterceptors([fn]) / HttpInterceptorFn
//   • Typed HTTP responses with interfaces
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: PostsComponent
// ---------------------------------------------------------------------------
// selector='app-posts'
// Inject HttpClient. Fetch from 'https://jsonplaceholder.typicode.com/posts?_limit=5'
// Define Post interface: { userId: number; id: number; title: string; body: string }
// State signals: posts = signal<Post[]>([]), loading = signal(false), error = signal('')
// On init (ngOnInit / constructor): call loadPosts()
// loadPosts(): sets loading true, subscribes to http.get, handles error.
// Template: loading spinner, error message, or list of post cards.

// ---------------------------------------------------------------------------
// TODO 2: UserDetailComponent
// ---------------------------------------------------------------------------
// selector='app-user-detail'
// Fetch single user from 'https://jsonplaceholder.typicode.com/users/1'
// Define User interface: { id; name; email; phone; website; address: { city } }
// Use async pipe (store result as users$ Observable).
// Template: display user card with name, email, city.

// ---------------------------------------------------------------------------
// TODO 3: SearchUsersComponent
// ---------------------------------------------------------------------------
// selector='app-search-users'
// Fetch 'https://jsonplaceholder.typicode.com/users' once,
// then filter client-side using a Subject + debounceTime + map.
// Template: input + filtered list via async pipe.

// ---------------------------------------------------------------------------
// TODO 4: PostFormComponent
// ---------------------------------------------------------------------------
// selector='app-post-form'
// POST to 'https://jsonplaceholder.typicode.com/posts'
// with body: { title, body, userId: 1 }
// Display the response (id assigned by server).
// Handle loading + error states.

// ---------------------------------------------------------------------------
// TODO 5: HttpParamsComponent
// ---------------------------------------------------------------------------
// selector='app-http-params'
// Demonstrate HttpParams:
//   let params = new HttpParams().set('_limit', '3').set('userId', '1')
//   http.get<Post[]>(url, { params })
// Also show HttpHeaders usage.
// Template: select for limit (3/5/10), fetches on change.

// ---------------------------------------------------------------------------
// ROOT COMPONENT
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  template: `
    <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 3.3 — HttpClient</h1>
      <!-- TODO 6: add all components to imports[] and render them -->
    </div>
  `,
})
export class AppComponent {}
