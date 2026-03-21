// Phase 4 - Exercise 05: Query Params
// Topics: queryParams, queryParamMap, fragment, NavigationExtras,
//         queryParamsHandling: 'merge' | 'preserve', router.navigate with queryParams
//
// Docs: https://angular.dev/guide/routing/common-router-tasks#query-parameters-and-fragments

import { Component } from '@angular/core';

// ─────────────────────────────────────────────
// TODO 1: ProductSearchComponent
//
// - selector: 'app-product-search'
// - Reads ?q=, ?page=, ?category= from the URL
// - Inject ActivatedRoute, subscribe to route.queryParamMap
// - Display current search query, page number, and category
// - Add a text input that updates ?q= on input change:
//   this.router.navigate([], { relativeTo: this.route, queryParams: { q: value }, queryParamsHandling: 'merge' })
// ─────────────────────────────────────────────

// TODO 1: ProductSearchComponent
// @Component({ ... })
// export class ProductSearchComponent { }

// ─────────────────────────────────────────────
// TODO 2: PaginationComponent
//
// - selector: 'app-pagination'
// - @Input() totalPages = 10
// - Reads current ?page= from queryParamMap (default to 1)
// - Shows prev/next buttons that call router.navigate with updated ?page=
//   Use queryParamsHandling: 'merge' so other params (q, category) are preserved
// - Show page X of Y
// ─────────────────────────────────────────────

// TODO 2: PaginationComponent
// @Component({ ... })
// export class PaginationComponent { }

// ─────────────────────────────────────────────
// TODO 3: FilterComponent
//
// - selector: 'app-filter'
// - Has checkboxes for categories: ['Electronics', 'Books', 'Clothing']
// - Has a price range select: ['all', 'under50', '50to100', 'over100']
// - When filters change, write ALL selected filters to query params:
//   router.navigate([], { queryParams: { category: selected, price: priceRange }, queryParamsHandling: 'merge' })
// - On init, restore filter state from current query params
// ─────────────────────────────────────────────

// TODO 3: FilterComponent
// @Component({ ... })
// export class FilterComponent { }

// ─────────────────────────────────────────────
// TODO 4: FragmentNavigationComponent
//
// - selector: 'app-fragment-nav'
// - Show a page with 3 sections (intro, details, contact)
// - Links that navigate to each section using fragment:
//   router.navigate([], { fragment: 'details' })
//   or template: <a routerLink="." fragment="details">
// - Read current fragment: route.fragment observable
// - Display "Current fragment: #details"
// ─────────────────────────────────────────────

// TODO 4: FragmentNavigationComponent
// @Component({ ... })
// export class FragmentNavigationComponent { }

// ─────────────────────────────────────────────
// TODO 5: QueryParamsHandlingComponent
//
// - selector: 'app-qp-handling'
// - Demonstrate the difference between queryParamsHandling values:
//   'merge'    — keeps existing params, adds/updates new ones
//   'preserve' — keeps existing params, ignores new ones
//   ''         — (default) replaces all params with the new ones
// - Show 3 buttons, each navigating with a different strategy
// - Display the resulting query string after each click
// ─────────────────────────────────────────────

// TODO 5: QueryParamsHandlingComponent
// @Component({ ... })
// export class QueryParamsHandlingComponent { }

// ─────────────────────────────────────────────
// TODO 6: Add all components to imports[] and render them in AppComponent
// ─────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO 6: import components here
  ],
  template: `
    <h1>Query Params Exercise</h1>
    <!-- TODO 6: render components here -->
  `,
})
export class AppComponent {}
