import { Component, Injectable, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { createAction, createReducer, createSelector, createFeatureSelector,
         on, props, Store } from '@ngrx/store';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { switchMap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

// ============================================================
// Solution 7.3 — NgRx Effects
// ============================================================

// SOLUTION 1: Actions
interface Post { id: number; title: string; body: string; userId: number; }

export const loadPosts        = createAction('[Posts] Load Posts');
export const loadPostsSuccess = createAction('[Posts] Load Posts Success', props<{ posts: Post[] }>());
export const loadPostsFailure = createAction('[Posts] Load Posts Failure', props<{ error: string }>());

// SOLUTION 2: Reducer
export interface PostsState { posts: Post[]; loading: boolean; error: string | null; }
const initialPostsState: PostsState = { posts: [], loading: false, error: null };

export const postsReducer = createReducer(
  initialPostsState,
  on(loadPosts,        state => ({ ...state, loading: true, error: null })),
  on(loadPostsSuccess, (state, { posts }) => ({ ...state, posts, loading: false })),
  on(loadPostsFailure, (state, { error }) => ({ ...state, error, loading: false })),
);

// SOLUTION 3: Effect
@Injectable()
export class LoadPostsEffects {
  private actions$ = inject(Actions);
  private http     = inject(HttpClient);

  loadPosts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadPosts),
      switchMap(() =>
        this.http.get<Post[]>('https://jsonplaceholder.typicode.com/posts?_limit=5').pipe(
          map(posts => loadPostsSuccess({ posts })),
          catchError(err => of(loadPostsFailure({ error: err.message }))),
        )
      ),
    )
  );
}

// Selectors
const selectPostsState = createFeatureSelector<PostsState>('posts');
const selectAllPosts   = createSelector(selectPostsState, s => s.posts);
const selectLoading    = createSelector(selectPostsState, s => s.loading);
const selectError      = createSelector(selectPostsState, s => s.error);

// SOLUTION 4: PostsComponent
@Component({
  selector: 'app-posts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Posts (NgRx Effects)</h3>
      @if (loading()) { <p>Loading...</p> }
      @if (error()) { <p style="color:red">Error: {{ error() }}</p> }
      @for (post of posts(); track post.id) {
        <div style="padding:4px 0;border-bottom:1px solid #eee;">
          <strong>#{{ post.id }}:</strong> {{ post.title }}
        </div>
      }
      <button (click)="store.dispatch(loadPosts())" style="margin-top:8px">Load Posts</button>
    </section>
  `,
})
class PostsComponent implements OnInit {
  store   = inject(Store);
  posts   = toSignal(this.store.select(selectAllPosts), { initialValue: [] as Post[] });
  loading = toSignal(this.store.select(selectLoading),  { initialValue: false });
  error   = toSignal(this.store.select(selectError),    { initialValue: null });
  loadPosts = loadPosts;

  ngOnInit() { this.store.dispatch(loadPosts()); }
}

// SOLUTION 5: Error display component
@Component({
  selector: 'app-error-effect',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      @if (error()) {
        <div style="background:#ffe0e0;border:1px solid #f00;padding:8px;border-radius:4px;margin-top:8px;">
          Error: {{ error() }}
          <button (click)="store.dispatch(loadPosts())" style="margin-left:8px">Retry</button>
        </div>
      }
    </section>
  `,
})
class ErrorEffectComponent {
  store     = inject(Store);
  error     = toSignal(this.store.select(selectError), { initialValue: null });
  loadPosts = loadPosts;
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PostsComponent, ErrorEffectComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 7.3 — NgRx Effects</h1>
      <p><em>Requires: provideStore(&#123; posts: postsReducer &#125;) + provideEffects([LoadPostsEffects]) in main.ts</em></p>
      <app-posts />
      <app-error-effect />
    </div>
  `,
})
export class AppComponent {}
