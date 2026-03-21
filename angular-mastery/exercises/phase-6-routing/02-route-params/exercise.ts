import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

// ============================================================
// Exercise 6.2 — Route Parameters
// ============================================================
// Topics:
//   • ActivatedRoute — paramMap, queryParamMap
//   • Reading :id from URL params
//   • Query params (?q=&category=)
//   • withComponentInputBinding() — receive params as @Input
//   • Breadcrumb from route hierarchy
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: UserListComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-user-list'.
// Import RouterLink.
// Declare a list of users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }, ...]
// Render each user as a RouterLink to /users/:id.
//
// @Component({ selector: 'app-user-list', standalone: true, imports: [RouterLink], ... })
// export class UserListComponent { ... }

// ---------------------------------------------------------------------------
// TODO 2: UserDetailComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-user-detail'.
// Inject ActivatedRoute using inject(ActivatedRoute).
// Read the :id param from paramMap.
// Display the user with that id (look up from the same users array).
//
// @Component({ selector: 'app-user-detail', standalone: true, ... })
// export class UserDetailComponent { ... }

// ---------------------------------------------------------------------------
// TODO 3: SearchComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-search'.
// Inject ActivatedRoute.
// Read queryParamMap for ?q= and ?category= params.
// Display filtered results from a mock list based on the query params.
// Add buttons/links that navigate with different query params.
//
// @Component({ selector: 'app-search', standalone: true, ... })
// export class SearchComponent { ... }

// ---------------------------------------------------------------------------
// TODO 4: InputBindingComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-input-binding'.
// Use withComponentInputBinding() (configured in provideRouter in main.ts).
// Declare @Input() id: string = ''.
// The router automatically passes the :id route param as this input.
// Display the id received via input binding.
//
// @Component({ selector: 'app-input-binding', standalone: true, ... })
// export class InputBindingComponent { ... }

// ---------------------------------------------------------------------------
// TODO 5: BreadcrumbComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-breadcrumb'.
// Inject ActivatedRoute and Router.
// Build a breadcrumb trail from the current route hierarchy.
// Display it as "Home > Users > User 1".
//
// @Component({ selector: 'app-breadcrumb', standalone: true, ... })
// export class BreadcrumbComponent { ... }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 6.2 — Route Parameters</h1>
      <!-- TODO: render UserListComponent and other demos -->
      <router-outlet />
    </div>
  `,
})
export class AppComponent {}
