// Phase 5 - Solution 02: NgRx Effects
// Topics: createEffect, Actions, ofType, switchMap, catchError, EMPTY, withLatestFrom
//
// main.ts setup:
//   import { provideEffects } from '@ngrx/effects';
//   bootstrapApplication(AppComponent, {
//     providers: [
//       provideStore({ posts: postsReducer }),
//       provideEffects([PostsEffects]),
//     ]
//   });

import { Component, signal, OnInit, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Post interface + actions
// ─────────────────────────────────────────────────────────────────────────────

export interface Post { id: number; title: string; body: string; userId: number; }

/*
// REAL NgRx Actions:
import { createAction, props } from '@ngrx/store';

export const loadPosts        = createAction('[Posts] Load');
export const loadPostsSuccess = createAction('[Posts] Load Success', props<{ posts: Post[] }>());
export const loadPostsFailure = createAction('[Posts] Load Failure', props<{ error: string }>());
export const formChange       = createAction('[Form] Change',        props<{ field: string; value: string }>());
export const showNotification = createAction('[UI] Show Notification', props<{ message: string; type: 'success' | 'error' }>());
*/

// Shim action types
const LOAD_POSTS         = '[Posts] Load';
const LOAD_POSTS_SUCCESS = '[Posts] Load Success';
const LOAD_POSTS_FAILURE = '[Posts] Load Failure';
const FORM_CHANGE        = '[Form] Change';
const SHOW_NOTIFICATION  = '[UI] Show Notification';

type Action =
  | { type: typeof LOAD_POSTS }
  | { type: typeof LOAD_POSTS_SUCCESS; posts: Post[] }
  | { type: typeof LOAD_POSTS_FAILURE; error: string }
  | { type: typeof FORM_CHANGE;        field: string; value: string }
  | { type: typeof SHOW_NOTIFICATION;  message: string; notifType: 'success' | 'error' };

const loadPosts         = ():                                   Action => ({ type: LOAD_POSTS });
const loadPostsSuccess  = (posts: Post[]):                      Action => ({ type: LOAD_POSTS_SUCCESS, posts });
const loadPostsFailure  = (error: string):                      Action => ({ type: LOAD_POSTS_FAILURE, error });
const formChange        = (f: string, v: string):               Action => ({ type: FORM_CHANGE, field: f, value: v });
const showNotification  = (message: string, notifType: 'success' | 'error'): Action =>
  ({ type: SHOW_NOTIFICATION, message, notifType });

// ─────────────────────────────────────────────────────────────────────────────
// Posts state + reducer
// ─────────────────────────────────────────────────────────────────────────────

interface PostsState {
  posts:    Post[];
  loading:  boolean;
  error:    string | null;
  notification: { message: string; type: 'success' | 'error' } | null;
}

const initialPostsState: PostsState = {
  posts: [], loading: false, error: null, notification: null,
};

function postsReducer(state: PostsState = initialPostsState, action: Action): PostsState {
  switch (action.type) {
    case LOAD_POSTS:
      return { ...state, loading: true, error: null };
    case LOAD_POSTS_SUCCESS:
      return { ...state, loading: false, posts: (action as { posts: Post[] }).posts };
    case LOAD_POSTS_FAILURE:
      return { ...state, loading: false, error: (action as { error: string }).error };
    case SHOW_NOTIFICATION: {
      const a = action as { message: string; notifType: 'success' | 'error' };
      return { ...state, notification: { message: a.message, type: a.notifType } };
    }
    default: return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Simulated Store
// ─────────────────────────────────────────────────────────────────────────────

class SimulatedPostsStore {
  private _state = signal<PostsState>(initialPostsState);

  get state() { return this._state; }

  dispatch(action: Action): void {
    this._state.set(postsReducer(this._state(), action));
    // Run effects
    this.handleEffects(action);
  }

  private async handleEffects(action: Action) {
    // loadPosts$ effect
    if (action.type === LOAD_POSTS) {
      try {
        const resp = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
        const posts: Post[] = await resp.json();
        this.dispatch(loadPostsSuccess(posts));
        this.dispatch(showNotification('Posts loaded successfully!', 'success'));
      } catch (e) {
        const error = e instanceof Error ? e.message : 'Unknown error';
        this.dispatch(loadPostsFailure(error));
        this.dispatch(showNotification(error, 'error'));
      }
    }
    // autoSave effect (debounced in real impl)
    if (action.type === FORM_CHANGE) {
      const a = action as { field: string; value: string };
      console.log(`[autoSave effect] Would save ${a.field}=${a.value} after 1s debounce`);
      // In real: debounceTime(1000), then http.post(...)
    }
  }
}

const postsStore = new SimulatedPostsStore();

// ─────────────────────────────────────────────────────────────────────────────
// 2–4. PostsEffects (shown as code + inline in simulation above)
// ─────────────────────────────────────────────────────────────────────────────

/*
// REAL NgRx Effects:
import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { catchError, debounceTime, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { of, EMPTY } from 'rxjs';

@Injectable()
export class PostsEffects {
  private actions$ = inject(Actions);
  private http      = inject(HttpClient);
  private store     = inject(Store);

  // 2. Load posts effect
  loadPosts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadPosts),
      switchMap(() =>
        this.http.get<Post[]>('https://jsonplaceholder.typicode.com/posts').pipe(
          map(posts  => loadPostsSuccess({ posts })),
          catchError(err => of(loadPostsFailure({ error: err.message })))
        )
      )
    )
  );

  // 3. Auto-save effect (dispatch: true to re-dispatch notification)
  autoSave$ = createEffect(() =>
    this.actions$.pipe(
      ofType(formChange),
      debounceTime(1000),
      switchMap(({ field, value }) =>
        this.http.post('/api/autosave', { field, value }).pipe(
          map(() => showNotification({ message: 'Saved!', type: 'success' })),
          catchError(() => of(showNotification({ message: 'Auto-save failed', type: 'error' })))
        )
      )
    )
  );

  // 4. Notification effect for multiple success/failure actions
  notify$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadPostsSuccess, loadPostsFailure),
      map(action => {
        if (action.type === loadPostsSuccess.type) {
          return showNotification({ message: 'Posts loaded!', type: 'success' });
        }
        return showNotification({ message: action.error, type: 'error' });
      })
    )
  );

  // Non-dispatching effect (side effect only — e.g., logging)
  logActions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadPosts, loadPostsSuccess, loadPostsFailure),
      tap(action => console.log('[Effect] Action:', action.type))
    ),
    { dispatch: false }  // ← important: prevents infinite loop
  );
}
*/

// ─────────────────────────────────────────────────────────────────────────────
// 5. PostsComponent
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding:1.5rem; background:#e8f5e9; border-radius:8px; margin-bottom:1rem">
      <h2>Posts (NgRx Effects Demo)</h2>

      <button (click)="loadPosts()"
              [disabled]="state().loading"
              style="padding:0.4rem 1rem; background:#2e7d32; color:white; border:none; border-radius:4px; cursor:pointer; margin-bottom:1rem">
        {{ state().loading ? 'Loading...' : 'Load Posts' }}
      </button>

      <!-- Notification banner -->
      @if (state().notification) {
        <div [style.background]="state().notification!.type === 'success' ? '#c8e6c9' : '#ffcdd2'"
             style="padding:0.5rem 1rem; border-radius:4px; margin-bottom:1rem; font-weight:500">
          {{ state().notification!.message }}
        </div>
      }

      <!-- Loading spinner -->
      @if (state().loading) {
        <div style="text-align:center; padding:2rem; color:#666">Loading posts...</div>
      }

      <!-- Error -->
      @if (state().error) {
        <div style="padding:0.75rem; background:#ffcdd2; border-radius:4px; margin-bottom:1rem">
          Error: {{ state().error }}
        </div>
      }

      <!-- Posts list -->
      @if (!state().loading && state().posts.length > 0) {
        <ul style="list-style:none; padding:0; display:flex; flex-direction:column; gap:0.5rem">
          @for (post of state().posts; track post.id) {
            <li style="background:white; padding:0.75rem; border-radius:4px; border-left:3px solid #2e7d32">
              <strong>{{ post.title }}</strong>
              <p style="margin:0.25rem 0 0; font-size:0.9rem; color:#555">{{ post.body | slice:0:100 }}...</p>
            </li>
          }
        </ul>
      }

      <div style="margin-top:1rem; font-size:0.85rem; background:#f1f8e9; padding:0.75rem; border-radius:4px">
        <strong>Effect Flow:</strong>
        dispatch(loadPosts()) → loadPosts$ effect → HTTP GET → dispatch(loadPostsSuccess/Failure) →
        reducer updates state → notify$ effect → dispatch(showNotification)
      </div>
    </div>
  `,
})
export class PostsComponent implements OnInit {
  state = postsStore.state;

  ngOnInit() {
    // In real app: this.store.dispatch(loadPosts());
    // Effects handle the async work — component stays clean
  }

  loadPosts() {
    postsStore.dispatch(loadPosts());
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, PostsComponent],
  template: `
    <div style="font-family:sans-serif; max-width:800px; margin:2rem auto; padding:0 1rem">
      <h1>Phase 5 – NgRx Effects</h1>
      <app-posts />
      <div style="padding:1rem; background:#f5f5f5; border-radius:8px; font-size:0.85rem">
        <strong>NgRx Effects Cheat Sheet:</strong>
        <ul>
          <li><code>createEffect(() => actions$.pipe(ofType(action), switchMap(...)))</code></li>
          <li><code>ofType(actionA, actionB)</code> — listen to multiple actions</li>
          <li><code>switchMap</code> — cancels previous HTTP if new action arrives (search)</li>
          <li><code>concatMap</code> — queues each request (sequential order)</li>
          <li><code>exhaustMap</code> — ignores new actions while one is in-flight (submit button)</li>
          <li><code>catchError(err => of(failureAction(err)))</code> — handle errors gracefully</li>
          <li><code>&#123; dispatch: false &#125;</code> — side-effect only, don't dispatch result</li>
          <li><code>withLatestFrom(store.select(selector))</code> — combine action with store slice</li>
          <li>Register: <code>provideEffects([MyEffects])</code> in bootstrapApplication providers</li>
        </ul>
      </div>
    </div>
  `,
})
export class AppComponent {}
