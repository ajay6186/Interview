import { Component } from '@angular/core';

// ============================================================
// Exercise 7.5 — NgRx ComponentStore
// ============================================================
// Topics:
//   • ComponentStore<State>
//   • updater() — synchronous state updates
//   • effect() — async operations
//   • select() — derive slices
//   • Component-scoped state
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: MovieComponentStore — State
// ---------------------------------------------------------------------------
// Create a MovieComponentStore extending ComponentStore.
// Interface: MovieState { movies: Movie[]; loading: boolean; error: string | null }
// interface Movie { id: number; title: string; year: number; }
// Initialize with { movies: [], loading: false, error: null }.
//
// import { ComponentStore } from '@ngrx/component-store';
// @Injectable()
// export class MovieComponentStore extends ComponentStore<MovieState> { ... }

// ---------------------------------------------------------------------------
// TODO 2: Updaters
// ---------------------------------------------------------------------------
// Add updaters to MovieComponentStore:
//   - setMovies(movies: Movie[]) — replaces the movies array
//   - setLoading(loading: boolean) — updates loading state
//   - setError(error: string | null) — updates error state
//
// setMovies   = this.updater((state, movies: Movie[]) => ({ ...state, movies }));
// setLoading  = this.updater((state, loading: boolean) => ({ ...state, loading }));
// setError    = this.updater((state, error: string | null) => ({ ...state, error }));

// ---------------------------------------------------------------------------
// TODO 3: Effect — loadMovies
// ---------------------------------------------------------------------------
// Add an effect to MovieComponentStore that:
//   - Sets loading to true
//   - Fetches from https://jsonplaceholder.typicode.com/posts?_limit=5
//   - Maps results to Movie format: { id, title, year: 2024 }
//   - Calls setMovies on success
//   - Calls setError on failure
//   - Sets loading to false in both cases
//
// loadMovies = this.effect(() => { ... });

// ---------------------------------------------------------------------------
// TODO 4: MovieListComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-movie-list'.
// Provide MovieComponentStore in the component (providers array).
// Inject MovieComponentStore.
// Call loadMovies in ngOnInit.
// Select and display movies, loading, and error.
//
// @Component({ selector: 'app-movie-list', standalone: true,
//   providers: [MovieComponentStore], ... })
// export class MovieListComponent { ... }

// ---------------------------------------------------------------------------
// TODO 5: MovieSearchComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-movie-search'.
// Create a SearchStore extending ComponentStore with:
//   - State: { query: string; results: Movie[] }
//   - updater: setQuery
//   - effect: search (debounce 300ms, filters from a static movie list)
// Display results as the user types.
//
// @Component({ selector: 'app-movie-search', standalone: true, ... })
// export class MovieSearchComponent { ... }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO: Add MovieListComponent and MovieSearchComponent
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 7.5 — ComponentStore</h1>
      <!-- TODO: render components -->
    </div>
  `,
})
export class AppComponent {}
