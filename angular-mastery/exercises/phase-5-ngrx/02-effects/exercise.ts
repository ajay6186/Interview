// Phase 5 - Exercise 02: NgRx Effects
// Topics: createEffect, Actions, ofType, switchMap, catchError, EMPTY, withLatestFrom
//
// Setup: npm install @ngrx/effects
// main.ts: provideEffects([PostsEffects])
// Docs: https://ngrx.io/guide/effects

import { Component } from '@angular/core';

// ─────────────────────────────────────────────
// TODO 1: Define Posts actions
//
// Import createAction, props from '@ngrx/store'
//
// Create:
// - loadPosts         (no payload)   — triggers the HTTP call
// - loadPostsSuccess  ({ posts: Post[] })  — dispatched on success
// - loadPostsFailure  ({ error: string })  — dispatched on error
// - formChange        ({ field: string; value: string }) — for auto-save
// - showNotification  ({ message: string; type: 'success' | 'error' })
//
// Define interface Post { id: number; title: string; body: string; userId: number; }
// ─────────────────────────────────────────────

// TODO 1: Post interface + actions
// export interface Post { ... }
// export const loadPosts        = createAction('[Posts] Load');
// export const loadPostsSuccess = createAction('[Posts] Load Success', props<{ posts: Post[] }>());
// export const loadPostsFailure = createAction('[Posts] Load Failure', props<{ error: string }>());
// export const formChange       = createAction('[Form] Change', props<{ field: string; value: string }>());
// export const showNotification = createAction('[UI] Show Notification', props<{ message: string; type: 'success' | 'error' }>());

// ─────────────────────────────────────────────
// TODO 2: PostsEffects — loadPosts$ effect
//
// - Import Injectable, inject from '@angular/core'
// - Import Actions, createEffect, ofType from '@ngrx/effects'
// - Import HttpClient from '@angular/common/http'
// - Inject Actions (private actions$ = inject(Actions)) and HttpClient
//
// loadPosts$ effect:
// - ofType(loadPosts)
// - switchMap(() => this.http.get<Post[]>('https://jsonplaceholder.typicode.com/posts')
//     .pipe(
//       map(posts => loadPostsSuccess({ posts })),
//       catchError(err => of(loadPostsFailure({ error: err.message })))
//     )
//   )
//
// @Injectable() export class PostsEffects { ... }
// ─────────────────────────────────────────────

// TODO 2: PostsEffects class
// @Injectable()
// export class PostsEffects { ... }

// ─────────────────────────────────────────────
// TODO 3: autoSaveEffect
//
// Add to PostsEffects:
// - Listen to formChange action
// - debounceTime(1000) — wait 1s after last keystroke
// - switchMap(({ field, value }) => http.post('/api/autosave', { field, value }))
// - On success: dispatch showNotification({ message: 'Saved!', type: 'success' })
// - On error: dispatch showNotification({ message: 'Save failed', type: 'error' })
// - Use { dispatch: true } (default) since we dispatch a notification
// ─────────────────────────────────────────────

// TODO 3: autoSaveEffect — add to PostsEffects class

// ─────────────────────────────────────────────
// TODO 4: notificationEffect
//
// Add to PostsEffects:
// - Listen to MULTIPLE actions: ofType(loadPostsSuccess, loadPostsFailure)
// - For success: dispatch showNotification({ message: 'Posts loaded!', type: 'success' })
// - For failure: dispatch showNotification({ message: action.error, type: 'error' })
// - Use a type guard or switchMap + if/else to distinguish
// ─────────────────────────────────────────────

// TODO 4: notificationEffect — add to PostsEffects class

// ─────────────────────────────────────────────
// TODO 5: PostsComponent
//
// - Inject Store
// - Dispatch loadPosts() in ngOnInit
// - Select:
//   posts$   = store.select(selectPosts)
//   loading$ = store.select(selectLoading)
//   error$   = store.select(selectError)
//
// Template:
// - Show spinner (loading)
// - Show error message (error)
// - Show list of posts (posts) using @for
// - Show notification (if showNotification was dispatched)
// ─────────────────────────────────────────────

// TODO 5: PostsComponent
// @Component({ ... })
// export class PostsComponent { }

// ─────────────────────────────────────────────
// TODO 6: Add PostsComponent to imports[] in AppComponent
// ─────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO 6: import PostsComponent
  ],
  template: `
    <h1>NgRx Effects Exercise</h1>
    <!-- TODO 6: render PostsComponent -->
  `,
})
export class AppComponent {}
