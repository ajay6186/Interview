import { Component, Injectable, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ComponentStore } from '@ngrx/component-store';
import { tapResponse } from '@ngrx/operators';
import { switchMap, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

// ============================================================
// Solution 7.5 — NgRx ComponentStore
// ============================================================

interface Movie { id: number; title: string; year: number; }

// SOLUTIONS 1-3: MovieComponentStore
interface MovieState { movies: Movie[]; loading: boolean; error: string | null; }

@Injectable()
class MovieComponentStore extends ComponentStore<MovieState> {
  private http = inject(HttpClient);

  constructor() { super({ movies: [], loading: false, error: null }); }

  // Selects
  readonly movies$  = this.select(s => s.movies);
  readonly loading$ = this.select(s => s.loading);
  readonly error$   = this.select(s => s.error);

  // SOLUTION 2: Updaters
  readonly setMovies  = this.updater((state, movies: Movie[])     => ({ ...state, movies }));
  readonly setLoading = this.updater((state, loading: boolean)    => ({ ...state, loading }));
  readonly setError   = this.updater((state, error: string|null)  => ({ ...state, error }));

  // SOLUTION 3: Effect
  readonly loadMovies = this.effect<void>($ =>
    $.pipe(
      switchMap(() => {
        this.setLoading(true);
        return this.http.get<{ id: number; title: string }[]>(
          'https://jsonplaceholder.typicode.com/posts?_limit=5'
        ).pipe(
          tapResponse(
            posts => {
              const movies: Movie[] = posts.map(p => ({ id: p.id, title: p.title, year: 2024 }));
              this.setMovies(movies);
              this.setLoading(false);
            },
            (err: Error) => { this.setError(err.message); this.setLoading(false); },
          ),
        );
      }),
    )
  );
}

// SOLUTION 4: MovieListComponent
@Component({
  selector: 'app-movie-list',
  standalone: true,
  providers: [MovieComponentStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>ComponentStore — Movie List</h3>
      @if (loading()) { <p>Loading...</p> }
      @if (error()) { <p style="color:red">{{ error() }}</p> }
      @for (movie of movies(); track movie.id) {
        <div style="padding:4px 0;border-bottom:1px solid #eee;">
          {{ movie.title }} ({{ movie.year }})
        </div>
      }
      <button (click)="store.loadMovies()" style="margin-top:8px">Reload</button>
    </section>
  `,
})
class MovieListComponent implements OnInit {
  store   = inject(MovieComponentStore);
  movies  = toSignal(this.store.movies$,  { initialValue: [] as Movie[] });
  loading = toSignal(this.store.loading$, { initialValue: false });
  error   = toSignal(this.store.error$,   { initialValue: null });

  ngOnInit() { this.store.loadMovies(); }
}

// SOLUTION 5: MovieSearchComponent
const ALL_MOVIES: Movie[] = [
  { id: 1, title: 'The Matrix', year: 1999 },
  { id: 2, title: 'Inception', year: 2010 },
  { id: 3, title: 'Interstellar', year: 2014 },
  { id: 4, title: 'The Dark Knight', year: 2008 },
  { id: 5, title: 'Avatar', year: 2009 },
];

interface SearchState { query: string; results: Movie[]; }

@Injectable()
class SearchStore extends ComponentStore<SearchState> {
  constructor() { super({ query: '', results: ALL_MOVIES }); }

  readonly query$   = this.select(s => s.query);
  readonly results$ = this.select(s => s.results);

  readonly setQuery = this.updater((state, query: string) => ({ ...state, query }));

  readonly search = this.effect<string>(query$ =>
    query$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        const results = q
          ? ALL_MOVIES.filter(m => m.title.toLowerCase().includes(q.toLowerCase()))
          : ALL_MOVIES;
        return of(results);
      }),
    ).pipe(
      tapResponse(
        results => this.patchState({ results }),
        () => {},
      )
    )
  );
}

@Component({
  selector: 'app-movie-search',
  standalone: true,
  providers: [SearchStore],
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>ComponentStore — Debounced Search</h3>
      <input [(ngModel)]="q" (ngModelChange)="onSearch($event)" placeholder="Search movies..." />
      @for (movie of results(); track movie.id) {
        <p>{{ movie.title }} ({{ movie.year }})</p>
      }
    </section>
  `,
})
class MovieSearchComponent {
  store   = inject(SearchStore);
  results = toSignal(this.store.results$, { initialValue: ALL_MOVIES });
  q = '';

  onSearch(query: string) {
    this.store.setQuery(query);
    this.store.search(query);
  }
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MovieListComponent, MovieSearchComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 7.5 — ComponentStore</h1>
      <app-movie-list />
      <hr />
      <app-movie-search />
    </div>
  `,
})
export class AppComponent {}
