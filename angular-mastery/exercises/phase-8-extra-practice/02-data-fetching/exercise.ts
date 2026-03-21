import { Component } from '@angular/core';

// ============================================================
// Exercise 8.2 — Data Fetching Patterns
// ============================================================
// Topics:
//   • HttpClient with loading/error signals
//   • Infinite scroll with IntersectionObserver
//   • Polling with timer() + switchMap
//   • Parallel requests with forkJoin
//   • Pagination (prev/next)
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: SimpleHttpComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-simple-http'.
// Inject HttpClient.
// Fetch posts from https://jsonplaceholder.typicode.com/posts?_limit=10.
// Display:
//   - A loading spinner (simple "Loading..." text) while fetching
//   - An error message if the fetch fails
//   - The list of posts when loaded
// Use signals for loading, error, and posts state.
//
// @Component({ selector: 'app-simple-http', standalone: true, ... })
// export class SimpleHttpComponent { ... }

// ---------------------------------------------------------------------------
// TODO 2: InfiniteScrollComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-infinite-scroll'.
// Start with page 1, _limit=5.
// Use IntersectionObserver on a sentinel <div> at the bottom.
// When the sentinel enters the viewport, load the next page and append to the list.
// Show "Loading more..." when fetching next page.
//
// @Component({ selector: 'app-infinite-scroll', standalone: true, ... })
// export class InfiniteScrollComponent { ... }

// ---------------------------------------------------------------------------
// TODO 3: RefreshComponent (polling)
// ---------------------------------------------------------------------------
// Create a component with selector 'app-refresh'.
// Use timer(0, 5000).pipe(switchMap(() => http.get(url))) to poll every 5 seconds.
// Display the time of the last refresh and the data.
// Add a "Stop/Start" toggle button.
//
// @Component({ selector: 'app-refresh', standalone: true, ... })
// export class RefreshComponent { ... }

// ---------------------------------------------------------------------------
// TODO 4: ParallelFetchComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-parallel-fetch'.
// On button click, use forkJoin to fetch:
//   - /posts?_limit=3
//   - /users?_limit=3
// Display both datasets once they both complete.
// Show loading state while waiting.
//
// @Component({ selector: 'app-parallel-fetch', standalone: true, ... })
// export class ParallelFetchComponent { ... }

// ---------------------------------------------------------------------------
// TODO 5: PaginatedComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-paginated'.
// Fetch posts with pagination: ?_page=N&_limit=5.
// Add Previous / Next buttons. Disable Prev on page 1.
// Display current page number and fetched posts.
//
// @Component({ selector: 'app-paginated', standalone: true, ... })
// export class PaginatedComponent { ... }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO: Add all exercise components
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 8.2 — Data Fetching</h1>
      <!-- TODO: render all components -->
    </div>
  `,
})
export class AppComponent {}
