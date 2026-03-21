import { Component } from '@angular/core';

// ============================================================
// Exercise 7.3 — NgRx Effects
// ============================================================
// Topics:
//   • createEffect / Actions / ofType
//   • switchMap for HTTP in effects
//   • Success/Failure action pattern
//   • Side effects (toast notifications)
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: Posts Actions
// ---------------------------------------------------------------------------
// Create actions for loading posts:
//   - loadPosts (no props) — triggers the effect
//   - loadPostsSuccess — props: { posts: Post[] }
//   - loadPostsFailure — props: { error: string }
//
// interface Post { id: number; title: string; body: string; userId: number; }
// export const loadPosts        = createAction('[Posts] Load Posts');
// export const loadPostsSuccess = createAction('[Posts] Load Posts Success', props<{ posts: Post[] }>());
// export const loadPostsFailure = createAction('[Posts] Load Posts Failure', props<{ error: string }>());

// ---------------------------------------------------------------------------
// TODO 2: Posts Reducer
// ---------------------------------------------------------------------------
// Create a postsReducer handling:
//   State: { posts: Post[]; loading: boolean; error: string | null }
//   - loadPosts: set loading: true
//   - loadPostsSuccess: set posts, loading: false
//   - loadPostsFailure: set error, loading: false
//
// export const postsReducer = createReducer(initialState, on(...), ...);

// ---------------------------------------------------------------------------
// TODO 3: LoadPostsEffect
// ---------------------------------------------------------------------------
// Create an effect class LoadPostsEffects decorated with @Injectable().
// Inject Actions and HttpClient.
// Create loadPosts$ = createEffect(() => this.actions$.pipe(
//   ofType(loadPosts),
//   switchMap(() => this.http.get<Post[]>('...').pipe(
//     map(posts => loadPostsSuccess({ posts })),
//     catchError(err => of(loadPostsFailure({ error: err.message })))
//   ))
// ));
//
// @Injectable()
// export class LoadPostsEffects { ... }

// ---------------------------------------------------------------------------
// TODO 4: PostsComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-posts'.
// Inject Store.
// Dispatch loadPosts in ngOnInit.
// Select posts, loading, and error from the store.
// Display a loading spinner, error message, or list of posts.
//
// @Component({ selector: 'app-posts', standalone: true, ... })
// export class PostsComponent { ... }

// ---------------------------------------------------------------------------
// TODO 5: ErrorEffectComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-error-effect'.
// Inject Store.
// Select the error from the posts state.
// Display an inline error banner (simulate a toast notification).
// Add a "Retry" button that dispatches loadPosts.
//
// @Component({ selector: 'app-error-effect', standalone: true, ... })
// export class ErrorEffectComponent { ... }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO: Add PostsComponent and ErrorEffectComponent
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 7.3 — NgRx Effects</h1>
      <!-- TODO: render components -->
    </div>
  `,
})
export class AppComponent {}
