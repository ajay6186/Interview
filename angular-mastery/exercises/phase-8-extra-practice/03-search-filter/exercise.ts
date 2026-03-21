import { Component } from '@angular/core';

// ============================================================
// Exercise 8.3 — Search & Filter
// ============================================================
// Topics:
//   • Signal-based filtering
//   • Debounced search with RxJS
//   • Multi-filter (name + category + status)
//   • Sortable columns
//   • Search highlight (pipe or template)
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: BasicSearchComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-basic-search'.
// Declare a static list of 10 countries (name as string).
// Use a signal for the search query.
// Use computed() to derive the filtered list.
// Bind the input value to the search query signal.
//
// @Component({ selector: 'app-basic-search', standalone: true, ... })
// export class BasicSearchComponent { ... }

// ---------------------------------------------------------------------------
// TODO 2: DebounceSearchComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-debounce-search'.
// Use a Subject<string> for the input stream.
// Apply debounceTime(300) + distinctUntilChanged().
// Use toSignal() to convert the result to a signal.
// Filter a list of programming languages.
//
// @Component({ selector: 'app-debounce-search', standalone: true, ... })
// export class DebounceSearchComponent { ... }

// ---------------------------------------------------------------------------
// TODO 3: MultiFilterComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-multi-filter'.
// Declare items with { name, category, status: 'active'|'inactive' }.
// Provide 3 filter signals: nameFilter, categoryFilter, statusFilter.
// Use computed() to apply all three filters simultaneously.
// Show dropdowns/inputs for each filter.
//
// @Component({ selector: 'app-multi-filter', standalone: true, ... })
// export class MultiFilterComponent { ... }

// ---------------------------------------------------------------------------
// TODO 4: SortableListComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-sortable-list'.
// Declare items with { name: string, date: string, price: number }.
// Allow sorting by each column (click header to sort, click again to reverse).
// Use a sortField signal and sortDir ('asc'|'desc') signal.
// Use computed() for the sorted list.
//
// @Component({ selector: 'app-sortable-list', standalone: true, ... })
// export class SortableListComponent { ... }

// ---------------------------------------------------------------------------
// TODO 5: SearchHighlightComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-search-highlight'.
// Create a Pipe named 'highlight' that wraps matched text in <mark> tags.
// Use it to highlight search matches in the results list.
// Use [innerHTML] to render the highlighted HTML safely.
//
// @Pipe({ name: 'highlight', standalone: true })
// export class HighlightPipe implements PipeTransform { ... }
//
// @Component({ selector: 'app-search-highlight', standalone: true, imports: [HighlightPipe], ... })
// export class SearchHighlightComponent { ... }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO: Add all exercise components
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 8.3 — Search &amp; Filter</h1>
      <!-- TODO: render all components -->
    </div>
  `,
})
export class AppComponent {}
